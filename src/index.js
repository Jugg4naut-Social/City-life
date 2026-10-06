export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/player") {
      try {
        const body = await request.json();

        const name = String(body.name || "").trim();
        

        if (!name) {
          return Response.json(
            { error: "Enter a valid name." },
            { status: 400 }
          );
        }

        const id = crypto.randomUUID();

        await env.Db.prepare(`
          INSERT INTO players
          (id, username, display_name, balance, health, energy, happiness, reputation)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
          .bind(id, name, name, 2000, 100, 100, 70, 0)
          .run();

        return Response.json({
          success: true,
          player: {
            id,
            name,
            balance: 2000,
            health: 100,
            energy: 100,
            happiness: 70,
            reputation: 0
          }
        });
      } catch (error) {
        return Response.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    if (request.method === "GET" && url.pathname === "/api/homes") {
      try {
        const homes = await env.Db.prepare(`
          SELECT id, name, district, monthly_rent, purchase_price, comfort, available
          FROM homes
          WHERE available = 1
          ORDER BY purchase_price ASC
        `).all();

        return Response.json({
          success: true,
          homes: homes.results
        });
      } catch (error) {
        return Response.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    if (request.method === "POST" && url.pathname === "/api/home") {
      try {
        const body = await request.json();
        const playerId = String(body.player_id || "").trim();
        const homeId = String(body.home_id || "").trim();

        if (!playerId || !homeId) {
          return Response.json(
            { error: "Player and home are required." },
            { status: 400 }
          );
        }

        const player = await env.Db.prepare(`
          SELECT id, balance
          FROM players
          WHERE id = ?
        `).bind(playerId).first();

        if (!player) {
          return Response.json(
            { error: "Player not found." },
            { status: 404 }
          );
        }

        const home = await env.Db.prepare(`
          SELECT id, name, district, monthly_rent, purchase_price, comfort, available
          FROM homes
          WHERE id = ? AND available = 1
        `).bind(homeId).first();

        if (!home) {
          return Response.json(
            { error: "Home is not available." },
            { status: 404 }
          );
        }

        if (player.balance < home.monthly_rent) {
          return Response.json(
            { error: "You cannot afford the first month\x27s rent yet." },
            { status: 400 }
          );
        }

        const existing = await env.Db.prepare(`
          SELECT id
          FROM player_homes
          WHERE player_id = ?
        `).bind(playerId).first();

        if (existing) {
          return Response.json(
            { error: "You already have a home." },
            { status: 400 }
          );
        }

        const ownershipId = crypto.randomUUID();

        await env.Db.prepare(`
          INSERT INTO player_homes
          (id, player_id, home_id, rent_due, move_in_date)
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          ownershipId,
          playerId,
          home.id,
          home.monthly_rent,
          new Date().toISOString()
        ).run();

        await env.Db.prepare(`
          UPDATE players
          SET balance = balance - ?
          WHERE id = ?
        `).bind(home.monthly_rent, playerId).run();

        return Response.json({
          success: true,
          message: "Welcome to your new rented home!",
          home: home,
          balance: player.balance - home.monthly_rent
        });
      } catch (error) {
        return Response.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }


    if (request.method === "GET" && url.pathname == "/api/jobs") {
      try {
        const jobs = await env.Db.prepare(`
          SELECT id, title, category, salary, energy_cost, skill_required
          FROM jobs
          ORDER BY salary ASC
        `).all();

        return Response.json({
          success: true,
          jobs: jobs.results
        });
      } catch (error) {
        return Response.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    if (request.method === "POST" && url.pathname == "/api/job") {
      try {
        const body = await request.json();
        const playerId = String(body.player_id || "").trim();
        const jobId = String(body.job_id || "").trim();

        if (!playerId || !jobId) {
          return Response.json(
            { error: "Player and job are required." },
            { status: 400 }
          );
        }

        const player = await env.Db.prepare(`
          SELECT id, energy, balance
          FROM players
          WHERE id = ?
        `).bind(playerId).first();

        if (!player) {
          return Response.json(
            { error: "Player not found." },
            { status: 404 }
          );
        }

        const job = await env.Db.prepare(`
          SELECT id, title, category, salary, energy_cost, skill_required
          FROM jobs
          WHERE id = ?
        `).bind(jobId).first();

        if (!job) {
          return Response.json(
            { error: "Job not found." },
            { status: 404 }
          );
        }

        const existing = await env.Db.prepare(`
          SELECT id
          FROM player_jobs
          WHERE player_id = ? AND active = 1
        `).bind(playerId).first();

        if (existing) {
          return Response.json(
            { error: "You already have an active job." },
            { status: 400 }
          );
        }

        if (player.energy < job.energy_cost) {
          return Response.json(
            { error: "You do not have enough energy for this job." },
            { status: 400 }
          );
        }

        const jobIdForPlayer = crypto.randomUUID();

        await env.Db.prepare(`
          INSERT INTO player_jobs
          (id, player_id, job_id, started_at, active)
          VALUES (?, ?, ?, ?, 1)
        `).bind(
          jobIdForPlayer,
          playerId,
          job.id,
          new Date().toISOString()
        ).run();

        return Response.json({
          success: true,
          message: "You got the job!",
          job: job
        });
      } catch (error) {
        return Response.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    if (request.method === "POST" && url.pathname == "/api/work") {
      try {
        const body = await request.json();
        const playerId = String(body.player_id || "").trim();

        if (!playerId) {
          return Response.json(
            { error: "Player is required." },
            { status: 400 }
          );
        }

        const player = await env.Db.prepare(`
          SELECT id, balance, energy
          FROM players
          WHERE id = ?
        `).bind(playerId).first();

        if (!player) {
          return Response.json(
            { error: "Player not found." },
            { status: 404 }
          );
        }

        const job = await env.Db.prepare(`
          SELECT
            j.id,
            j.title,
            j.salary,
            j.energy_cost
          FROM player_jobs pj
          JOIN jobs j ON j.id = pj.job_id
          WHERE pj.player_id = ? AND pj.active = 1
        `).bind(playerId).first();

        if (!job) {
          return Response.json(
            { error: "You need a job before you can work." },
            { status: 400 }
          );
        }

        if (player.energy < job.energy_cost) {
          return Response.json(
            { error: "You are too tired to work. Rest and try again." },
            { status: 400 }
          );
        }

        const newBalance = player.balance + job.salary;
        const newEnergy = player.energy - job.energy_cost;

        await env.Db.prepare(`
          UPDATE players
          SET balance = ?, energy = ?
          WHERE id = ?
        `).bind(
          newBalance,
          newEnergy,
          playerId
        ).run();

        return Response.json({
          success: true,
          message: "Work completed! You earned $" + job.salary + ".",
          job: job.title,
          earned: job.salary,
          balance: newBalance,
          energy: newEnergy
        });
      } catch (error) {
        return Response.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    if (url.pathname === "/api/health") {
      return Response.json({
        success: true,
        game: "City Life",
        status: "online"
      });
    }

    return new Response(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>City Life</title>
<style>
body{
margin:0;
font-family:Arial,sans-serif;
background:#090d16;
color:white;
display:flex;
justify-content:center;
padding:30px 15px
}
main{width:100%;max-width:500px}
h1{text-align:center;font-size:42px;margin-bottom:5px}
.tag{text-align:center;color:#9da8bd;margin-bottom:30px}
.card{
background:#151c2b;
padding:25px;
border-radius:20px
}
input,button{
width:100%;
padding:15px;
margin-top:12px;
box-sizing:border-box;
border-radius:10px;
font-size:16px
}
input{
background:#0d1320;
border:1px solid #303b52;
color:white
}
button{
border:0;
font-weight:bold;
cursor:pointer
}
.start{background:white;color:#111}
.stats{
display:grid;
grid-template-columns:1fr 1fr;
gap:10px;
margin-top:20px
}
.stat{
background:#202a3d;
padding:15px;
border-radius:10px
}
.small{color:#9da8bd;font-size:13px}
#result{margin-top:20px}
</style>
</head>
<body>
<main>
<h1>🏙️ CITY LIFE</h1>
<div class="tag">Build a life. Build an empire.</div>

<div class="card">
<h2>Create Your Character</h2>

<input id="name" placeholder="Character name">
<input id="age" type="number" min="18" max="100" placeholder="Age">

<button class="start" onclick="createPlayer()">
START YOUR LIFE
</button>

<div id="result"></div>
<div id="homes"></div>
</div>

<script>

async function showHomes(playerId){
  const homes=document.getElementById("homes");
  homes.innerHTML="<p>Finding available homes...</p>";

  try{
    const response=await fetch("/api/homes");
    const data=await response.json();

    if(!response.ok){
      homes.innerHTML="<p>"+data.error+"</p>";
      return;
    }

    if(!data.homes.length){
      homes.innerHTML="<p>No homes are available right now.</p>";
      return;
    }

    homes.innerHTML =
      "<h2>🏠 Choose Your Home</h2>" +
      "<p class='small'>This is your first major decision. Choose wisely.</p>" +
      data.homes.map(h =>
        "<div class='stat' style='margin-top:12px'>" +
        "<h3>"+h.name+"</h3>" +
        "<p>📍 "+h.district+"</p>" +
        "<p>💰 Buy: $"+h.purchase_price+"</p>" +
        "<p>🏷️ Rent: $"+h.monthly_rent+"/month</p>" +
        "<p>✨ Comfort: "+h.comfort+"</p>" +
        "<button class='start' onclick='chooseHome(""+playerId+"",""+h.id+"")'>RENT & MOVE IN</button>" +
        "</div>"
      ).join("");
  }catch(error){
    homes.innerHTML="<p>Unable to load homes.</p>";
  }
}

async function chooseHome(playerId, homeId){
  const homes=document.getElementById("homes");
  homes.innerHTML="<p>Moving you into your new home...</p>";

  try{
    const response=await fetch("/api/home",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        player_id:playerId,
        home_id:homeId
      })
    });

    const data=await response.json();

    if(!response.ok){
      homes.innerHTML="<p>"+data.error+"</p>";
      return;
    }

    homes.innerHTML =
      "<h2>🏠 You're Home!</h2>" +
      "<p>Welcome to <strong>"+data.home.name+"</strong>.</p>" +
      "<p>📍 "+data.home.district+"</p>" +
      "<p>💰 Remaining cash: $"+data.balance+"</p>" +
      "<button class='start' onclick='alert("Jobs are coming next!")'>LOOK FOR A JOB</button>";
  }catch(error){
    homes.innerHTML="<p>Unable to complete your move.</p>";
  }
}

async function createPlayer(){
  const name=document.getElementById("name").value;
  const age=document.getElementById("age").value;
  const result=document.getElementById("result");

  result.innerHTML="Creating your life...";

  try{
    const response=await fetch("/api/player",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({name})
    });

    const data=await response.json();

    if(!response.ok){
      result.innerHTML="<p>"+data.error+"</p>";
      return;
    }

    const p=data.player;


result.innerHTML =
  "<h2>Welcome, " + p.name + "! 🎉</h2>" +
  "<p>Your new life has begun.</p>" +

  '<div class="stats">' +

  '<div class="stat">' +
  "💰 $" + p.balance +
  '<div class="small">Cash</div>' +
  "</div>" +

  '<div class="stat">' +
  "❤️ " + p.health +
  '<div class="small">Health</div>' +
  "</div>" +

  '<div class="stat">' +
  "⚡ " + p.energy +
  '<div class="small">Energy</div>' +
  "</div>" +

  '<div class="stat">' +
  "😊 " + p.happiness +
  '<div class="small">Happiness</div>' +
  "</div>" +

  "</div>";  
}catch(error){
    result.innerHTML="<p>Unable to create player.</p>";
  }
}
</script>

</main>
</body>
</html>
    `, {
      headers: {
        "Content-Type": "text/html;charset=UTF-8"
      }
    });
  }
};
