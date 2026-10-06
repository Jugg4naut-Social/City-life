let player = null;
let currentJob = null;
let currentSkill = null;

const $ = id => document.getElementById(id);

window.addEventListener("error", function(event){
  const box = $("runtimeStatus");
  if(box) box.textContent = "JavaScript error: " + event.message;
});

function setRuntime(message, good=true){
  const box = $("runtimeStatus");
  if(!box) return;
  box.textContent = message;
  box.style.color = good ? "#bff3cc" : "#ffc0c9";
}

document.addEventListener("DOMContentLoaded", function(){
  setRuntime("JavaScript loaded successfully.");

  const button = $("startLifeButton");
  const input = $("name");

  if(button) button.addEventListener("click", createPlayer);

  if(input){
    input.addEventListener("keydown", function(e){
      if(e.key === "Enter") createPlayer();
    });
  }
});

function esc(value){
  return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function playerName(){
  return player?.name || player?.display_name || player?.username || "Citizen";
}

function stat(label,value,max=100){
  const n=Math.max(0,Number(value)||0);
  const width=Math.min(100,(n/max)*100);

  return `
    <div class="stat">
      <div class="stat-value">${esc(n)}</div>
      <div class="stat-label">${esc(label)}</div>
      <div class="progress"><i style="width:${width}%"></i></div>
    </div>`;
}

function renderStats(){
  if(!player) return "";

  return `
    <div class="stats">
      <div class="stat">
        <div class="stat-value">$${Number(player.balance||0).toLocaleString()}</div>
        <div class="stat-label">CASH</div>
      </div>
      ${stat("HEALTH",player.health)}
      ${stat("ENERGY",player.energy)}
      ${stat("HAPPINESS",player.happiness)}
    </div>`;
}

function renderDashboard(){
  if(!player) return;

  $("dashboard").innerHTML = `
    <section class="card">
      <div class="dashboard-head">
        <div>
          <div class="eyebrow">YOUR CITY LIFE</div>
          <h2>Welcome, ${esc(playerName())}</h2>
          <div class="cash">$${Number(player.balance||0).toLocaleString()}</div>
        </div>
        <div class="character-mini"></div>
      </div>
      ${renderStats()}
    </section>`;
}

async function api(url,options={}){
  const response = await fetch(url,options);
  let data = {};

  try{
    data = await response.json();
  }catch(e){
    data = {error:"The server returned an invalid response."};
  }

  if(!response.ok){
    throw new Error(data.error || "Something went wrong.");
  }

  return data;
}

async function createPlayer(){
  const input = $("name");
  const result = $("result");
  const name = input ? input.value.trim() : "";

  if(!name){
    result.innerHTML = `
      <div class="error">
        <strong>Choose a character name.</strong>
        <div class="small">Your name becomes part of your City Life identity.</div>
      </div>`;
    return;
  }

  if(name.length < 2){
    result.innerHTML = `<div class="error">Your character name needs at least 2 characters.</div>`;
    return;
  }

  result.innerHTML = `
    <div class="character-stage">
      <div class="character">
        <div class="hair"></div><div class="head"></div><div class="face"></div>
        <div class="body"></div><div class="arm arm-left"></div><div class="arm arm-right"></div>
        <div class="leg leg-left"></div><div class="leg leg-right"></div>
      </div>
      <div class="ground"></div>
    </div>
    <h2>Creating your life...</h2>
    <p class="small">Finding your place in the city.</p>`;

  try{
    const data = await api("/api/player",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({name})
    });

    player = data.player || data;
    renderDashboard();

    result.innerHTML = `
      <div class="section-title">
        <div class="section-icon">★</div>
        <div>
          <div class="eyebrow">NEW CITIZEN</div>
          <h2>Your story begins</h2>
        </div>
      </div>

      <p>Welcome, <strong>${esc(playerName())}</strong>. You have <strong>$2,000</strong> to begin building your future.</p>

      <div class="success">
        Character created successfully. Your first decision is where to live.
      </div>

      <button class="primary" onclick="showHomes()">CHOOSE YOUR HOME</button>`;

    await showHomes();

  }catch(error){
    result.innerHTML = `<div class="error">${esc(error.message)}</div>`;
  }
}

function homeVisual(home){
  const name = String(home.name||"").toLowerCase();

  if(name.includes("studio")) return "⌂";
  if(name.includes("penthouse")) return "◆";
  if(name.includes("modern")) return "▣";
  return "🏠";
}

async function showHomes(){
  const homes = $("homes");

  homes.innerHTML = `
    <section class="card">
      <div class="section-title">
        <div class="section-icon">⌂</div>
        <div><div class="eyebrow">PROPERTY</div><h2>Choose Your Home</h2></div>
      </div>
      <p class="small">Start modestly. Build your wealth. Upgrade when you're ready.</p>
      <p>Loading available properties...</p>
    </section>`;

  try{
    const data = await api("/api/homes");

    homes.innerHTML = `
      <section class="card">
        <div class="section-title">
          <div class="section-icon">⌂</div>
          <div><div class="eyebrow">PROPERTY MARKET</div><h2>Choose Your Home</h2></div>
        </div>
        <p class="small">Your first month's rent is paid when you move in.</p>
        <div class="grid">
          ${data.homes.map(h => {
            const affordable = Number(player.balance) >= Number(h.monthly_rent);

            return `
              <div class="option">
                <div class="option-visual">${homeVisual(h)}</div>
                <div class="option-title">${esc(h.name)}</div>
                <div class="option-meta">
                  <span class="pill">${esc(h.district)}</span>
                  <br>
                  Rent: <strong>$${Number(h.monthly_rent).toLocaleString()}</strong>/month<br>
                  Buy later: $${Number(h.purchase_price).toLocaleString()}<br>
                  Comfort: ${Number(h.comfort)}/100
                </div>
                ${
                  affordable
                  ? `<button class="primary" onclick="chooseHome('${esc(h.id)}')">MOVE IN</button>`
                  : `<button class="secondary" disabled>NOT AFFORDABLE</button>`
                }
              </div>`;
          }).join("")}
        </div>
      </section>`;

  }catch(error){
    homes.innerHTML = `<div class="error">${esc(error.message)}</div>`;
  }
}

async function chooseHome(homeId){
  const homes = $("homes");

  homes.innerHTML = `
    <section class="card">
      <div class="section-icon">⌂</div>
      <h2>Moving in...</h2>
      <p class="small">Getting your new home ready.</p>
    </section>`;

  try{
    const data = await api("/api/home",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        player_id:player.id,
        home_id:homeId
      })
    });

    player.balance = data.balance;

    renderDashboard();

    homes.innerHTML = `
      <section class="card">
        <div class="section-title">
          <div class="section-icon">⌂</div>
          <div><div class="eyebrow">MOVE COMPLETE</div><h2>You're Home</h2></div>
        </div>

        <div class="success">
          Welcome to <strong>${esc(data.home.name)}</strong>.
        </div>

        <p class="small">District: ${esc(data.home.district)}</p>
        <p>Remaining cash: <strong>$${Number(data.balance).toLocaleString()}</strong></p>

        <button class="primary" onclick="showJobs()">FIND A JOB</button>
      </section>`;

    await showJobs();

  }catch(error){
    homes.innerHTML = `<div class="error">${esc(error.message)}</div>`;
  }
}

function jobVisual(category){
  const c = String(category||"").toLowerCase();

  if(c.includes("technology")) return "</>";
  if(c.includes("creative")) return "✦";
  if(c.includes("health")) return "+";
  if(c.includes("security")) return "◆";
  if(c.includes("transport")) return "→";
  if(c.includes("business")) return "$";
  if(c.includes("retail")) return "▣";
  return "★";
}

function skillForJob(job){
  const map = {
    Service:"Practical",
    Retail:"Communication",
    Security:"Practical",
    Transport:"Practical",
    Business:"Business",
    Creative:"Creativity",
    Technology:"Technology",
    Legal:"Knowledge",
    Healthcare:"Knowledge"
  };

  return map[job.category] || "Practical";
}

async function showJobs(){
  const jobs = $("jobs");

  jobs.innerHTML = `
    <section class="card">
      <div class="section-title">
        <div class="section-icon">$</div>
        <div><div class="eyebrow">CAREER MARKET</div><h2>Find Your Career</h2></div>
      </div>
      <p>Loading opportunities...</p>
    </section>`;

  try{
    const data = await api("/api/jobs");

    jobs.innerHTML = `
      <section class="card">
        <div class="section-title">
          <div class="section-icon">$</div>
          <div><div class="eyebrow">CAREER MARKET</div><h2>Choose Your Career</h2></div>
        </div>
        <p class="small">Work, gain experience and unlock higher-paying careers.</p>

        <div class="grid">
          ${data.jobs.map(j => {
            const enoughEnergy = Number(player.energy) >= Number(j.energy_cost);
            const unlocked = Number(j.skill_required) === 0;

            return `
              <div class="option ${unlocked ? "" : "locked"}">
                <div class="option-visual">${jobVisual(j.category)}</div>
                <div class="option-title">${esc(j.title)}</div>
                <div class="option-meta">
                  <span class="pill">${esc(j.category)}</span>
                  <br>
                  Pay: <strong>$${Number(j.salary).toLocaleString()}</strong>/shift<br>
                  Energy: ${Number(j.energy_cost)}<br>
                  Required skill: ${Number(j.skill_required)}
                </div>

                ${
                  unlocked && enoughEnergy
                  ? `<button class="primary" onclick="chooseJob('${esc(j.id)}')">TAKE THIS JOB</button>`
                  : unlocked
                  ? `<button class="secondary" disabled>TOO TIRED</button>`
                  : `<button class="secondary" disabled>LOCKED</button>`
                }
              </div>`;
          }).join("")}
        </div>
      </section>`;

  }catch(error){
    jobs.innerHTML = `<div class="error">${esc(error.message)}</div>`;
  }
}

async function chooseJob(jobId){
  const jobs = $("jobs");

  jobs.innerHTML = `
    <section class="card">
      <h2>Getting you hired...</h2>
      <p class="small">Preparing your first shift.</p>
    </section>`;

  try{
    const data = await api("/api/job",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        player_id:player.id,
        job_id:jobId
      })
    });

    currentJob = data.job;
    currentSkill = data.skill || skillForJob(data.job);

    jobs.innerHTML = `
      <section class="card">
        <div class="section-title">
          <div class="section-icon">★</div>
          <div><div class="eyebrow">CAREER STARTED</div><h2>You're Hired</h2></div>
        </div>

        <div class="success">
          You are now a <strong>${esc(data.job.title)}</strong>.
        </div>

        <p>Every shift earns <strong>$${Number(data.job.salary).toLocaleString()}</strong>.</p>
        <p class="small">Skill: ${esc(currentSkill)} &bull; Energy per shift: ${Number(data.job.energy_cost)}</p>

        <button class="primary" onclick="showWork()">GO TO WORK</button>
      </section>`;

    await showWork();

  }catch(error){
    jobs.innerHTML = `<div class="error">${esc(error.message)}</div>`;
  }
}

async function showWork(){
  const work = $("work");

  renderDashboard();

  work.innerHTML = `
    <section class="card">
      <div class="section-title">
        <div class="section-icon">★</div>
        <div><div class="eyebrow">DAILY LIFE</div><h2>Go To Work</h2></div>
      </div>

      <p>Put in the work, earn money and develop your ${esc(currentSkill || "skills")} skill.</p>

      ${renderStats()}

      <button class="primary" onclick="workJob()">WORK THIS SHIFT</button>
    </section>`;
}

async function workJob(){
  const work = $("work");

  work.innerHTML = `
    <section class="card">
      <div class="character-stage" style="margin:-20px -20px 18px">
        <div class="character">
          <div class="hair"></div><div class="head"></div><div class="face"></div>
          <div class="body"></div><div class="arm arm-left"></div><div class="arm arm-right"></div>
          <div class="leg leg-left"></div><div class="leg leg-right"></div>
        </div>
        <div class="ground"></div>
      </div>
      <h2>Working...</h2>
      <p class="small">Your shift is underway.</p>
    </section>`;

  try{
    const data = await api("/api/work",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({player_id:player.id})
    });

    player.balance = data.balance;
    player.energy = data.energy;

    renderDashboard();

    work.innerHTML = `
      <section class="card">
        <div class="section-title">
          <div class="section-icon">$</div>
          <div><div class="eyebrow">SHIFT COMPLETE</div><h2>Pay Day</h2></div>
        </div>

        <div class="success">
          You earned <strong>$${Number(data.earned).toLocaleString()}</strong>.
        </div>

        ${renderStats()}

        <div class="option">
          <div class="eyebrow">SKILL PROGRESS</div>
          <h3>${esc(data.skill)}</h3>
          <p>Experience: <strong>${Number(data.experience)}</strong> / 100</p>
          <div class="progress">
            <i style="width:${Math.min(100,Number(data.experience||0))}%"></i>
          </div>
          <p class="small">Level ${Number(data.level||0)} &bull; +${Number(data.xp_gained||0)} XP</p>

          ${
            data.level_up
            ? `<div class="level-up"><strong>LEVEL UP!</strong><br>Your ${esc(data.skill)} skill increased.</div>`
            : ""
          }
        </div>

        ${
          Number(player.energy) > 0
          ? `<button class="primary" onclick="workJob()">WORK AGAIN</button>`
          : `<div class="error">You're exhausted. Rest mechanics will be added to the next life-system upgrade.</div>`
        }
      </section>`;
      
  }catch(error){
    work.innerHTML = `
      <div class="error">${esc(error.message)}</div>
      <section class="card">${renderStats()}</section>`;
  }
}
