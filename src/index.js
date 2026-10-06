const CITYLIFE_JS = `

let player = null;

window.addEventListener("error", function(event){
  const box = document.getElementById("runtimeStatus");
  if (box) {
    box.textContent = "JavaScript error: " + event.message;
  }
});

const runtimeBox = document.getElementById("runtimeStatus");
if (runtimeBox) {
  runtimeBox.textContent = "JavaScript loaded successfully.";
}

document.addEventListener("DOMContentLoaded", function(){

  const startButton = document.getElementById("startLifeButton");

  if (startButton) {
    startButton.addEventListener("click", createPlayer);
  }

});

function renderStats(){
  if(!player) return;

  return '<div class="stats">' +

    '<div class="stat">💰 $' + player.balance +
    '<div class="small">Cash</div></div>' +

    '<div class="stat">❤️ ' + player.health +
    '<div class="small">Health</div></div>' +

    '<div class="stat">⚡ ' + player.energy +
    '<div class="small">Energy</div></div>' +

    '<div class="stat">😊 ' + player.happiness +
    '<div class="small">Happiness</div></div>' +

    '</div>';
}

async function createPlayer(){

  const name=document.getElementById("name").value.trim();
  const result=document.getElementById("result");

  if(!name){
    result.innerHTML='<div class="error">Please enter a character name.</div>';
    return;
  }

  result.innerHTML="<p>Creating your life...</p>";

  try{

    const response=await fetch("/api/player",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({name:name})
    });

    const data=await response.json();

    if(!response.ok){
      result.innerHTML='<div class="error">'+data.error+'</div>';
      return;
    }

    player=data.player;

    result.innerHTML =
      "<h2>Welcome, "+player.name+"! 🎉</h2>" +
      "<p>Your new life has begun.</p>" +
      renderStats() +

      "<div class='card' style='margin-top:16px'>" +
      "<h3>🏠 Choose Your First Home</h3>" +
      "<p>Your character is ready. Now choose where your new life begins.</p>" +
      "<button class='start' onclick='showHomes()'>CHOOSE YOUR HOME</button>" +
      "</div>";

  }catch(error){

    result.innerHTML=
      '<div class="error">Unable to create player: '+
      error.message+
      '</div>';

    console.error("createPlayer error:", error);

  }
}

async function showHomes(){

  const homes=document.getElementById("homes");

  homes.innerHTML=
    "<div class='card'><h2>🏠 Choose Your Home</h2>" +
    "<p class='small'>Your first major decision. You only pay the first month's rent.</p>" +
    "<p>Loading available homes...</p></div>";

  try{

    const response=await fetch("/api/homes");
    const data=await response.json();

    if(!response.ok){
      homes.innerHTML=
        "<div class='error'>"+data.error+"</div>";
      return;
    }

    homes.innerHTML=
      "<div class='card'>" +
      "<h2>🏠 Choose Your Home</h2>" +
      "<p class='small'>Rent first. Buy property later.</p>" +

      data.homes.map(function(h){

        const canAfford=player.balance >= h.monthly_rent;

        return "<div class='job'>" +

          "<h3>"+h.name+"</h3>" +

          "<p>📍 "+h.district+"</p>" +
          "<p>🏷️ Rent: $"+h.monthly_rent+"/month</p>" +
          "<p>💰 Purchase later: $"+h.purchase_price+"</p>" +
          "<p>✨ Comfort: "+h.comfort+"</p>" +

          (canAfford

            ? "<button class='start' onclick='chooseHome(\""+
              h.id+"\")'>RENT & MOVE IN</button>"

            : "<button class='secondary' disabled>CAN'T AFFORD</button>"

          ) +

          "</div>";

      }).join("") +

      "</div>";

  }catch(error){

    homes.innerHTML=
      "<div class='error'>Unable to load homes.</div>";

  }
}

async function chooseHome(homeId){

  const homes=document.getElementById("homes");

  homes.innerHTML=
    "<div class='card'><p>🏠 Moving you into your new home...</p></div>";

  try{

    const response=await fetch("/api/home",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        player_id:player.id,
        home_id:homeId
      })
    });

    const data=await response.json();

    if(!response.ok){

      homes.innerHTML=
        "<div class='error'>"+data.error+"</div>";

      return;
    }

    player.balance=data.balance;

    homes.innerHTML=
      "<div class='card'>" +
      "<h2>🏠 You're Home!</h2>" +
      "<p>Welcome to <strong>"+data.home.name+"</strong>.</p>" +
      "<p>📍 "+data.home.district+"</p>" +
      "<p>💰 Remaining cash: $"+data.balance+"</p>" +
      renderStats() +
      "</div>";

    await showJobs();

  }catch(error){

    homes.innerHTML=
      "<div class='error'>Unable to complete your move.</div>";

  }
}

async function showJobs(){

  const jobs=document.getElementById("jobs");

  jobs.innerHTML=
    "<div class='card'><h2>💼 Find a Job</h2>" +
    "<p>Loading opportunities...</p></div>";

  try{

    const response=await fetch("/api/jobs");
    const data=await response.json();

    if(!response.ok){

      jobs.innerHTML=
        "<div class='error'>"+data.error+"</div>";

      return;
    }

    jobs.innerHTML=
      "<div class='card'>" +
      "<h2>💼 Choose Your Career</h2>" +
      "<p class='small'>Better careers will become available as your skills grow.</p>" +

      data.jobs.map(function(j){

        const enoughEnergy=player.energy >= j.energy_cost;
        const skillUnlocked=j.skill_required === 0;

        return "<div class='job'>" +

          "<h3>"+j.title+"</h3>" +

          "<p>🏢 "+j.category+"</p>" +
          "<p>💵 Earn: $"+j.salary+" / work</p>" +
          "<p>⚡ Energy: "+j.energy_cost+"</p>" +
          "<p>🎯 Skill required: "+j.skill_required+"</p>" +

          (skillUnlocked && enoughEnergy

            ? "<button class='start' onclick='chooseJob(\""+
              j.id+"\")'>TAKE THIS JOB</button>"

            : skillUnlocked

              ? "<button class='secondary' disabled>TOO TIRED</button>"

              : "<button class='secondary' disabled>LOCKED FOR NOW</button>"

          ) +

          "</div>";

      }).join("") +

      "</div>";

  }catch(error){

    jobs.innerHTML=
      "<div class='error'>Unable to load jobs.</div>";

  }
}

async function chooseJob(jobId){

  const jobs=document.getElementById("jobs");

  jobs.innerHTML=
    "<div class='card'><p>💼 Getting you hired...</p></div>";

  try{

    const response=await fetch("/api/job",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        player_id:player.id,
        job_id:jobId
      })
    });

    const data=await response.json();

    if(!response.ok){

      jobs.innerHTML=
        "<div class='error'>"+data.error+"</div>";

      return;
    }

    jobs.innerHTML=
      "<div class='card'>" +
      "<h2>🎉 You're Hired!</h2>" +
      "<p>You are now a <strong>"+data.job.title+"</strong>.</p>" +
      "<p>💵 You earn $"+data.job.salary+" every time you work.</p>" +
      "<p>⚡ Each shift costs "+data.job.energy_cost+" energy.</p>" +
      "</div>";

    await showWork();

  }catch(error){

    jobs.innerHTML=
      "<div class='error'>Unable to get the job.</div>";

  }
}

async function showWork(){

  const work=document.getElementById("work");

  work.innerHTML=
    "<div class='card'>" +
    "<h2>🧑‍💼 Go To Work</h2>" +
    renderStats() +
    "<button class='start' onclick='workJob()'>WORK NOW</button>" +
    "</div>";

}

async function workJob(){

  const work=document.getElementById("work");

  work.innerHTML=
    "<div class='card'><p>🧑‍💼 Working...</p></div>";

  try{

    const response=await fetch("/api/work",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        player_id:player.id
      })
    });

    const data=await response.json();

    if(!response.ok){

      work.innerHTML=
        "<div class='error'>"+data.error+"</div>" +
        "<div class='card'>"+renderStats()+"</div>";

      return;
    }

    player.balance=data.balance;
    player.energy=data.energy;

    work.innerHTML=
      "<div class='card'>" +

      "<h2>💰 Pay Day!</h2>" +

      "<div class='success'>" +
      "You completed your shift and earned <strong>$"+
      data.earned+"</strong>!" +
      "</div>" +

      renderStats() +

      "<div class='card' style='margin-top:16px'>" +

      "<h3>🛠️ Skill Progress</h3>" +

      "<p><strong>"+data.skill+"</strong></p>" +

      "<p>⭐ XP: "+data.experience+" / 100</p>" +

      "<p>📈 Level: "+data.level+"</p>" +

      (data.level_up
        ? "<div class='success'>🎉 Level Up! Your "+data.skill+" skill increased.</div>"
        : "") +

      "</div>" +

      (player.energy > 0

        ? "<button class='start' onclick='workJob()'>WORK AGAIN</button>"

        : "<p class='small'>You're exhausted. Rest will be added to the next stage.</p>"

      ) +

      "</div>";

  }catch(error){

    work.innerHTML=
      "<div class='error'>Unable to complete work.</div>";

  }
}


`;

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

        if (String(error.message).includes("UNIQUE constraint failed: players.username")) {
          return Response.json(
            { error: "That character name is already taken. Please choose another." },
            { status: 409 }
          );
        }

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

        const skillMap = {
          Service: "Practical",
          Retail: "Communication",
          Security: "Practical",
          Transport: "Practical",
          Business: "Business",
          Creative: "Creativity",
          Technology: "Technology",
          Legal: "Knowledge",
          Healthcare: "Knowledge"
        };

        const primarySkill = skillMap[job.category] || "Practical";

        let skill = await env.Db.prepare(`
          SELECT level, experience
          FROM player_skills
          WHERE player_id = ? AND skill = ?
        `).bind(playerId, primarySkill).first();

        if (!skill) {
          await env.Db.prepare(`
            INSERT INTO player_skills
            (id, player_id, skill, level, experience)
            VALUES (?, ?, ?, 0, 0)
          `).bind(
            crypto.randomUUID(),
            playerId,
            primarySkill
          ).run();

          skill = { level: 0, experience: 0 };
        }

        if (skill.level < job.skill_required) {
          return Response.json(
            {
              error: "Your " + primarySkill + " skill is too low for this job.",
              skill: primarySkill,
              current_level: skill.level,
              required_level: job.skill_required
            },
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
          job: job,
          skill: primarySkill,
          skill_level: skill.level
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
            j.category,
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

        const skillMap = {
          Service: "Practical",
          Retail: "Communication",
          Security: "Practical",
          Transport: "Practical",
          Business: "Business",
          Creative: "Creativity",
          Technology: "Technology",
          Legal: "Knowledge",
          Healthcare: "Knowledge"
        };

        const primarySkill = skillMap[job.category] || "Practical";

        let skill = await env.Db.prepare(`
          SELECT id, level, experience
          FROM player_skills
          WHERE player_id = ? AND skill = ?
        `).bind(playerId, primarySkill).first();

        if (!skill) {
          const skillId = crypto.randomUUID();

          await env.Db.prepare(`
            INSERT INTO player_skills
            (id, player_id, skill, level, experience)
            VALUES (?, ?, ?, 0, 0)
          `).bind(
            skillId,
            playerId,
            primarySkill
          ).run();

          skill = {
            id: skillId,
            level: 0,
            experience: 0
          };
        }

        const xpGained = 10;
        const newExperience = skill.experience + xpGained;
        const newLevel = Math.floor(newExperience / 100);

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

        await env.Db.prepare(`
          UPDATE player_skills
          SET level = ?, experience = ?
          WHERE player_id = ? AND skill = ?
        `).bind(
          newLevel,
          newExperience,
          playerId,
          primarySkill
        ).run();

        return Response.json({
          success: true,
          message: "Work completed! You earned $" + job.salary + ".",
          job: job.title,
          earned: job.salary,
          balance: newBalance,
          energy: newEnergy,
          skill: primarySkill,
          xp_gained: xpGained,
          experience: newExperience,
          level: newLevel,
          level_up: newLevel > skill.level
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

    if (request.method === "GET" && url.pathname === "/citylife.js") {
      return new Response(CITYLIFE_JS, {
        headers: { "content-type": "application/javascript; charset=UTF-8" }
      });
    }

    return new Response(`<!DOCTYPE html>
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
padding:25px 15px
}
main{
width:100%;
max-width:600px;
margin:auto
}
h1{
text-align:center;
font-size:42px;
margin:10px 0 5px
}
.tag{
text-align:center;
color:#9da8bd;
margin-bottom:25px
}
.card{
background:#151c2b;
padding:22px;
border-radius:20px;
margin-bottom:15px
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
.start{
background:white;
color:#111
}
.secondary{
background:#26334a;
color:white
}
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
.small{
color:#9da8bd;
font-size:13px
}
.job{
background:#202a3d;
padding:17px;
border-radius:14px;
margin-top:12px
}
.job h3{
margin:0 0 8px
}
.job p{
margin:6px 0;
color:#c8d0df
}
.locked{
opacity:.5
}
.success{
background:#16351f;
padding:14px;
border-radius:10px;
margin-top:15px
}
.error{
background:#3a1820;
padding:14px;
border-radius:10px;
margin-top:15px
}
</style>
</head>

<body>
<main>

<div id="runtimeStatus" style="background:#3a1820;color:white;padding:10px;border-radius:8px;margin-bottom:15px;font-size:13px">
JavaScript starting...
</div>

<h1>🏙️ CITY LIFE</h1>
<div class="tag">Build a life. Build an empire.</div>

<div class="card">

<div id="result">
<h2>Start Your Life</h2>
<p class="small">
Create your character and begin with $2,000.
</p>

<input id="name" placeholder="Character name">

<button class="start" id="startLifeButton" onclick="createPlayer()">
START YOUR LIFE
</button>
</div>

<div id="homes"></div>
<div id="jobs"></div>
<div id="work"></div>

</div>

<script src="/citylife.js?v=7fde133"></script>

</main>
</body>
</html>`,
      {
        headers: {
          "content-type": "text/html;charset=UTF-8"
        }
      }
    );

  }
}
