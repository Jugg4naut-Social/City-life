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

    const html = await fetch(new URL("./index.html", request.url));

    return new Response(html.body, {
      headers: {
        "content-type": "text/html;charset=UTF-8"
      }
    });

  }
}
