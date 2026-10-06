
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

