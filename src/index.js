export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({
        success: true,
        game: "City Life",
        status: "online"
      });
    }

    return new Response(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>City Life</title>
  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: Arial, sans-serif;
      background:
        radial-gradient(circle at top, #26365f 0%, #101522 45%, #070a10 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .container {
      width: 100%;
      max-width: 900px;
      text-align: center;
    }

    .logo {
      font-size: 48px;
      font-weight: 800;
      letter-spacing: -2px;
      margin-bottom: 10px;
    }

    .tagline {
      font-size: 20px;
      color: #b8c2d9;
      margin-bottom: 40px;
    }

    .card {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 24px;
      padding: 40px 24px;
      backdrop-filter: blur(14px);
    }

    .card h1 {
      margin-top: 0;
      font-size: 32px;
    }

    .card p {
      color: #c5ccda;
      line-height: 1.7;
    }

    .start {
      margin-top: 25px;
      padding: 15px 28px;
      border: 0;
      border-radius: 12px;
      background: #ffffff;
      color: #111827;
      font-size: 17px;
      font-weight: 700;
      cursor: pointer;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-top: 30px;
    }

    .stat {
      background: rgba(255,255,255,0.06);
      padding: 18px 10px;
      border-radius: 14px;
    }

    .stat strong {
      display: block;
      font-size: 20px;
      margin-bottom: 5px;
    }

    .stat span {
      color: #9da8bd;
      font-size: 13px;
    }

    @media (max-width: 600px) {
      .logo {
        font-size: 38px;
      }

      .stats {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  </style>
</head>

<body>
  <main class="container">
    <div class="logo">CITY LIFE</div>

    <div class="tagline">
      Build a life. Build an empire.
    </div>

    <section class="card">
      <h1>Your story starts here.</h1>

      <p>
        Create your character, choose your home, build a career,
        earn money, own possessions, start businesses and influence
        the future of your city.
      </p>

      <button class="start" onclick="alert('Character creation is coming next.')">
        Start Your Life
      </button>

      <div class="stats">
        <div class="stat">
          <strong>$2,000</strong>
          <span>Starting Cash</span>
        </div>

        <div class="stat">
          <strong>100</strong>
          <span>Health</span>
        </div>

        <div class="stat">
          <strong>100</strong>
          <span>Energy</span>
        </div>

        <div class="stat">
          <strong>70</strong>
          <span>Happiness</span>
        </div>
      </div>
    </section>
  </main>
</body>
</html>`,
      {
        headers: {
          "Content-Type": "text/html; charset=UTF-8"
        }
      }
    );
  }
};
