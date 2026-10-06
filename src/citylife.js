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
        <div class="section-icon"></div>
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

  if(name.includes("studio")) return "";
  if(name.includes("penthouse")) return "";
  if(name.includes("modern")) return "";
  return "";
}

async function showHomes(){
  const homes = $("homes");

  homes.innerHTML = `
    <section class="card">
      <div class="section-title">
        <div class="section-icon"></div>
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
          <div class="section-icon"></div>
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
      <div class="section-icon"></div>
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
          <div class="section-icon"></div>
          <div><div class="eyebrow">MOVE COMPLETE</div><h2>You're Home</h2></div>
        </div>

        <div class="success">
          Welcome to <strong>${esc(data.home.name)}</strong>.
        </div>

        <p class="small">District: ${esc(data.home.district)}</p>
        <p>Remaining cash: <strong>$${Number(data.balance).toLocaleString()}</strong></p>

        <button class="primary" onclick="showJobs()">FIND A JOB</button>
      </section>`;

    showCity(data.home?.district || "Residential");
    await showJobs();

  }catch(error){
    homes.innerHTML = `<div class="error">${esc(error.message)}</div>`;
  }
}

function jobVisual(category){
  const c = String(category||"").toLowerCase();

  if(c.includes("technology")) return "</>";
  if(c.includes("creative")) return "";
  if(c.includes("health")) return "+";
  if(c.includes("security")) return "";
  if(c.includes("transport")) return "";
  if(c.includes("business")) return "$";
  if(c.includes("retail")) return "";
  return "";
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



function enterCityWorld(){
  const city = $("city");
  if(city){
    showCity(window.currentDistrict || "Residential");
    city.scrollIntoView({behavior:"smooth", block:"start"});
  }
}

function returnToCity(){
  enterCityWorld();
}


let cityScene=null;
let cityCamera=null;
let cityRenderer=null;
let cityRaycaster=null;
let cityMouse=null;
let cityAnimation=null;


function showCity(district="Residential"){
  const root=$("city");
  if(!root)return;

  if(cityAnimation)cancelAnimationFrame(cityAnimation);

  root.innerHTML=`
    <section class="card city-world-3d">
      <div class="eyebrow">CITY WORLD</div>
      <div class="world-title">
        <div>
          <h2>\${esc(district)}</h2>
          <p class="small">Explore the city and discover what your surroundings can offer.</p>
        </div>
        <strong>LIVE CITY</strong>
      </div>

      <div class="city3d-frame">
        <canvas id="cityCanvas"></canvas>
        <div class="city-controls">
          <button id="cityZoomIn">+</button>
          <button id="cityZoomOut">-</button>
          <button id="cityReset">RESET</button>
        </div>
        <div class="city-hint">DRAG TO MOVE - SCROLL TO ZOOM - TAP BUILDINGS</div>
      </div>

      <div class="district-tabs">
        <button class="\${district==='Residential'?'active':''}" onclick="showCity('Residential')">Residential</button>
        <button class="\${district==='Downtown'?'active':''}" onclick="showCity('Downtown')">Downtown</button>
        <button class="\${district==='Tech District'?'active':''}" onclick="showCity('Tech District')">Tech</button>
        <button class="\${district==='Business District'?'active':''}" onclick="showCity('Business District')">Business</button>
        <button class="\${district==='Entertainment'?'active':''}" onclick="showCity('Entertainment')">Entertainment</button>
        <button class="\${district==='Industrial'?'active':''}" onclick="showCity('Industrial')">Industrial</button>
      </div>

      <div id="cityLocationPanel"></div>
    </section>
  `;

  loadThreeCity(district);
}

function loadThreeCity(district){
  const status=$("cityLocationPanel");

  try{
    if(window.THREE){
      if(status) status.innerHTML='<div class="small">3D engine ready.</div>';
      buildThreeCity(district);
      return;
    }

    if(status) status.innerHTML='<div class="small">Loading 3D city engine...</div>';

    const s=document.createElement("script");
    s.src="https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.min.js";

    s.onload=()=>{
      if(window.THREE){
        if(status) status.innerHTML='<div class="small">3D engine loaded.</div>';
        try{
          buildThreeCity(district);
        }catch(error){
          if(status) status.innerHTML='<div class="city-load-error">3D build error: '+esc(error.message)+'</div>';
          showCityFallback(district);
        }
      }else{
        if(status) status.innerHTML='<div class="city-load-error">Three.js loaded but the 3D engine is unavailable.</div>';
        showCityFallback(district);
      }
    };

    s.onerror=()=>{
      if(status) status.innerHTML='<div class="city-load-error">Could not load the 3D engine from the external library.</div>';
      showCityFallback(district);
    };

    document.head.appendChild(s);

  }catch(error){
    if(status) status.innerHTML='<div class="city-load-error">3D startup error: '+esc(error.message)+'</div>';
    showCityFallback(district);
  }
}

function showCityFallback(district){
  const c=$("cityCanvas");
  if(c)c.outerHTML='<div class="city-load-error">City graphics could not load. Refresh to try again.</div>';
}

function buildThreeCity(district){
  const canvas=$("cityCanvas");
  if(!canvas||!window.THREE)return;

  const T=THREE;

  cityScene=new T.Scene();
  cityScene.background=new T.Color(0x9fc4dc);

  const width=canvas.clientWidth||innerWidth;
  const height=canvas.clientHeight||420;

  cityCamera=new T.OrthographicCamera(
    -width/28,width/28,height/28,-height/28,0.1,1000
  );

  cityCamera.position.set(42,55,42);
  cityCamera.lookAt(0,0,0);

  cityRenderer=new T.WebGLRenderer({
    canvas,
    antialias:true,
    powerPreference:"high-performance"
  });

  cityRenderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  cityRenderer.setSize(width,height,false);

  cityScene.add(new T.HemisphereLight(0xffffff,0x445566,2.2));

  const sun=new T.DirectionalLight(0xffffff,2.4);
  sun.position.set(-40,80,30);
  cityScene.add(sun);

  const ground=new T.Mesh(
    new T.PlaneGeometry(180,180),
    new T.MeshStandardMaterial({color:0x66775a})
  );

  ground.rotation.x=-Math.PI/2;
  cityScene.add(ground);

  const roadMat=new T.MeshStandardMaterial({color:0x34383d});
  const sidewalkMat=new T.MeshStandardMaterial({color:0x99958a});

  const water=new T.Mesh(
    new T.PlaneGeometry(180,42),
    new T.MeshStandardMaterial({
      color:0x287f9f,
      transparent:true,
      opacity:.9
    })
  );

  water.rotation.x=-Math.PI/2;
  water.position.set(0,-.08,-68);
  cityScene.add(water);

  for(let x=-60;x<=60;x+=12){
    const road=new T.Mesh(
      new T.BoxGeometry(4,.08,140),
      roadMat
    );

    road.position.set(x,.05,0);
    cityScene.add(road);

    const s1=new T.Mesh(
      new T.BoxGeometry(.8,.1,140),
      sidewalkMat
    );

    s1.position.set(x-2.45,.08,0);
    cityScene.add(s1);

    const s2=s1.clone();
    s2.position.x=x+2.45;
    cityScene.add(s2);
  }

  for(let z=-60;z<=60;z+=12){
    const road=new T.Mesh(
      new T.BoxGeometry(140,.08,4),
      roadMat
    );

    road.position.set(0,.06,z);
    cityScene.add(road);

    const s1=new T.Mesh(
      new T.BoxGeometry(140,.1,.8),
      sidewalkMat
    );

    s1.position.set(0,.08,z-2.45);
    cityScene.add(s1);

    const s2=s1.clone();
    s2.position.z=z+2.45;
    cityScene.add(s2);
  }

  const colors={
    house:0xb88763,
    apartment:0x788b9f,
    office:0x4e647e,
    tower:0x354c68,
    shop:0xa98257,
    civic:0x8b8b80,
    hotel:0x806b78,
    factory:0x686e6b
  };

  const buildings=[];

  function building(name,type,x,z,w,d,h){
    const body=new T.Mesh(
      new T.BoxGeometry(w,h,d),
      new T.MeshStandardMaterial({
        color:colors[type]||0x778899
      })
    );

    body.position.set(x,h/2+.15,z);

    body.userData={
      name,
      type,
      district,
      location:name
    };

    cityScene.add(body);
    buildings.push(body);

    if(type==="house"){
      const roof=new T.Mesh(
        new T.ConeGeometry(Math.max(w,d)*.72,Math.max(2,w*.38),4),
        new T.MeshStandardMaterial({color:0x583b36})
      );

      roof.position.set(x,h+1,z);
      roof.rotation.y=Math.PI/4;
      roof.userData=body.userData;

      cityScene.add(roof);
      buildings.push(roof);
    }

    if(type!=="factory"){
      const rows=Math.min(8,Math.max(2,Math.floor(h/4)));

      for(let r=0;r<rows;r++){
        const win=new T.Mesh(
          new T.BoxGeometry(Math.min(w*.55,1.2),.65,.08),
          new T.MeshStandardMaterial({color:0xe3c976})
        );

        win.position.set(
          x,
          h*(.22+.62*r/rows),
          z-d/2-.05
        );

        cityScene.add(win);
      }
    }
  }

  const buildingsData=[
    ["Maple Homes","house",-48,-42,7,7,5],
    ["Pine Homes","house",-24,-42,7,7,5],
    ["Oak Homes","house",0,-42,7,7,5],
    ["River Homes","house",24,-42,7,7,5],
    ["Garden Homes","house",48,-42,7,7,5],

    ["North Apartments","apartment",-36,-24,9,9,17],
    ["Parkside Apartments","apartment",-12,-24,9,9,20],
    ["Central Apartments","apartment",18,-24,10,10,24],
    ["Grand Apartments","apartment",42,-24,9,9,18],

    ["Metro Tower","tower",-36,0,10,10,48],
    ["Grand Office","office",-12,0,10,10,35],
    ["Central Plaza","tower",14,0,11,11,55],
    ["Commerce Tower","office",40,0,10,10,39],

    ["City Mall","shop",-48,18,14,10,10],
    ["Grand Hotel","hotel",48,20,12,11,30],

    ["Tech Campus","office",-36,36,12,10,32],
    ["Startup Hub","office",-12,36,10,10,27],
    ["Financial Centre","tower",15,36,11,11,50],
    ["Entertainment Hall","civic",40,36,14,10,12],

    ["Industrial Works","factory",-42,55,18,12,12],
    ["City Warehouse","factory",-12,55,16,12,10],
    ["Transport Depot","factory",18,55,18,12,10],
    ["Waterfront Hotel","hotel",48,55,13,11,28]
  ];

  buildingsData.forEach(b=>building(...b));

  function park(x,z,w,d){
    const p=new T.Mesh(
      new T.BoxGeometry(w,.15,d),
      new T.MeshStandardMaterial({color:0x3e7545})
    );

    p.position.set(x,.12,z);
    cityScene.add(p);

    for(let i=0;i<7;i++){
      const tree=new T.Mesh(
        new T.ConeGeometry(1.2,4,8),
        new T.MeshStandardMaterial({color:0x285d36})
      );

      tree.position.set(
        x-w/2+3+(i%4)*4,
        2.1,
        z-d/2+3+Math.floor(i/4)*5
      );

      cityScene.add(tree);
    }
  }

  park(-54,-4,9,22);
  park(28,-5,10,18);
  park(-2,48,18,8);

  for(let i=0;i<14;i++){
    const car=new T.Mesh(
      new T.BoxGeometry(2.5,.8,1.3),
      new T.MeshStandardMaterial({
        color:[0x9d4d43,0x345c83,0xb59a43,0xeeeeee][i%4]
      })
    );

    car.position.set(
      -60+(i%7)*20,
      .55,
      i%2===0 ? -2 : 2
    );

    cityScene.add(car);
  }

  const player=new T.Mesh(
    new T.CapsuleGeometry(.65,1.5,4,8),
    new T.MeshStandardMaterial({color:0x233f78})
  );

  player.position.set(0,1.6,8);
  cityScene.add(player);

  let dragging=false;
  let lastX=0;
  let lastY=0;

  canvas.onpointerdown=e=>{
    dragging=true;
    lastX=e.clientX;
    lastY=e.clientY;
    canvas.setPointerCapture(e.pointerId);
  };

  canvas.onpointermove=e=>{
    if(!dragging)return;

    const dx=e.clientX-lastX;
    const dy=e.clientY-lastY;

    cityCamera.position.x-=dx*.12;
    cityCamera.position.z+=dy*.12;

    cityCamera.lookAt(
      cityCamera.position.x*.15,
      0,
      cityCamera.position.z*.15
    );

    lastX=e.clientX;
    lastY=e.clientY;
  };

  canvas.onpointerup=()=>dragging=false;

  canvas.onwheel=e=>{
    e.preventDefault();

    const factor=e.deltaY>0?1.08:.92;

    cityCamera.zoom=Math.max(
      .55,
      Math.min(2.5,cityCamera.zoom*factor)
    );

    cityCamera.updateProjectionMatrix();
  };

  cityRaycaster=new T.Raycaster();
  cityMouse=new T.Vector2();

  canvas.onclick=e=>{
    const rect=canvas.getBoundingClientRect();

    cityMouse.x=((e.clientX-rect.left)/rect.width)*2-1;
    cityMouse.y=-((e.clientY-rect.top)/rect.height)*2+1;

    cityRaycaster.setFromCamera(cityMouse,cityCamera);

    const hits=cityRaycaster.intersectObjects(buildings,true);

    if(hits.length){
      const data=hits[0].object.userData;

      if(data&&data.name){
        openCityLocation(data.name,district);
      }
    }
  };

  $("cityZoomIn").onclick=()=>{
    cityCamera.zoom=Math.min(2.5,cityCamera.zoom*1.2);
    cityCamera.updateProjectionMatrix();
  };

  $("cityZoomOut").onclick=()=>{
    cityCamera.zoom=Math.max(.55,cityCamera.zoom/1.2);
    cityCamera.updateProjectionMatrix();
  };

  $("cityReset").onclick=()=>{
    cityCamera.position.set(42,55,42);
    cityCamera.zoom=1;
    cityCamera.lookAt(0,0,0);
    cityCamera.updateProjectionMatrix();
  };

  function resize(){
    const w=canvas.clientWidth||innerWidth;
    const h=canvas.clientHeight||420;

    cityCamera.left=-w/28;
    cityCamera.right=w/28;
    cityCamera.top=h/28;
    cityCamera.bottom=-h/28;

    cityCamera.updateProjectionMatrix();
    cityRenderer.setSize(w,h,false);
  }

  window.addEventListener("resize",resize);
  resize();

  function animate(){
    cityAnimation=requestAnimationFrame(animate);
    cityRenderer.render(cityScene,cityCamera);
  }

  animate();
}

function openCityLocation(location,district){
  const p=$("cityLocationPanel");

  if(!p)return;

  p.innerHTML=`
    <div class="location-panel">
      <div class="eyebrow">\${esc(district)}</div>
      <h3>\${esc(location)}</h3>
      <p class="small">You are standing at \${esc(location)}. This building is part of the living City Life world.</p>
      <button class="primary" onclick="showCity('\${esc(district)}')">RETURN TO CITY</button>
    </div>
  `;
}

async function showWork(){
  const work = $("work");

  renderDashboard();

  work.innerHTML = `
    <section class="card">
      <div class="section-title">
        <div class="section-icon"></div>
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
