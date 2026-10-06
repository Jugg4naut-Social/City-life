export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/player") {
      try {
        const body = await request.json();

        const name = String(body.name || "").trim();
        const age = Number(body.age);

        if (!name || !age || age < 18 || age > 100) {
          return Response.json(
            { error: "Enter a valid name and age (18-100)." },
            { status: 400 }
          );
        }

        const id = crypto.randomUUID();

        await env.Db.prepare(`
          INSERT INTO players
          (id, name, age, balance, health, energy, happiness, reputation)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
          .bind(id, name, age, 2000, 100, 100, 70, 0)
          .run();

        return Response.json({
          success: true,
          player: {
            id,
            name,
            age,
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
</div>

<script>
async function createPlayer(){
  const name=document.getElementById("name").value;
  const age=document.getElementById("age").value;
  const result=document.getElementById("result");

  result.innerHTML="Creating your life...";

  try{
    const response=await fetch("/api/player",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({name,age})
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
