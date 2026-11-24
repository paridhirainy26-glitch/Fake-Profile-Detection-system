/* ================= COMPONENTS ================= */
const gauge=(v,l)=>`<div class=gauge style="background:conic-gradient(${col(v)} ${v*360}deg,var(--line) 0)"><div><span><b>${pct(v)}</b><small class=mut>${l||''}</small></span></div></div>`;
const meter=(l,v)=>`<div style="margin:9px 0"><div class="row sp"><small>${l}</small><small class=mut>${pct(v)}</small></div><div class=bar><i style="width:${v*100}%;background:${col(v)}"></i></div></div>`;
const risk=r=>`<span class="pill ${cls(r)}">${lbl(r)} · ${pct(r)}</span>`;

function profTable(list, rowClick = true) {
  return `<div class=wrap>
    <table>
      <thead>
        <tr>
          <th>Username</th>
          <th>Platform</th>
          <th>Followers</th>
          <th>Following</th>
          <th>ML Score</th>
          <th>Risk</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${list.map(p => `
          <tr class="${rowClick ? 'click' : ''}"
            ${rowClick ? `onclick="location.hash='#/profile/${p.id}'"` : ''}>
            <td><b>@${esc(p.username)}</b></td>
            <td>${p.platform}</td>
            <td>${p.followers}</td>
            <td>${p.following}</td>
            <td>${pct(p.ml)}</td>
            <td>${risk(p.risk)}</td>
            <td><span class="pill n">${p.status}</span></td>
          </tr>
        `).join('') ||
        '<tr><td colspan="7" class="mut">No profiles found.</td></tr>'}
      </tbody>
    </table>
  </div>`;
}


async function makeReport(p) {
  let savedReports = [];

  try {
    savedReports = JSON.parse(localStorageGet('reports') || '[]');
    if (!Array.isArray(savedReports)) savedReports = [];
  } catch (e) {
    savedReports = [];
  }

  DB.reports = savedReports;

  const id = 'RPT-' + Date.now();

  const r = {
    id,
    profile: p,
    created: new Date().toLocaleString(),
    backend_status: 'pending'
  };

  DB.reports.unshift(r);
  localStorageSet('reports', JSON.stringify(DB.reports));

  try {
    const predictionId = Number(p.prediction_id ?? p.id);

    if (!Number.isInteger(predictionId) || predictionId <= 0) {
      throw new Error(
        'This profile has no valid backend prediction ID. Analyze it again first.'
      );
    }

    const response = await API.createReport(
      predictionId,
      'Suspicious profile',
      'Report generated from the Fake Social Media Profile Detection system.'
    );

    r.backend_status = 'saved';
    r.backend_report_id = response.report_id;

    localStorageSet('reports', JSON.stringify(DB.reports));
    toast('Report saved to MySQL');
  } catch (error) {
    r.backend_status = 'failed';
    localStorageSet('reports', JSON.stringify(DB.reports));
    toast('Local report created, but backend save failed: ' + error.message);
  }

  return r;
}
const nav=[['dashboard','📊','Dashboard'],['analyze','🔍','Analyze Profile'],['profiles','👥','Flagged Profiles'],['batch','📦','Batch Screening'],['reports','📄','Reports'],['model','🧠','Model Insights'],['team','🏫','Project & Team'],['settings','⚙️','Settings']];
function shell(page,title,body){return `<div class=shell><aside class=side id=side><div class=logo style="padding:6px 12px 16px">🛡️ Fake<em>Profile</em> Shield</div>${nav.map(n=>`<a href="#/${n[0]}" class="${page==n[0]?'on':''}">${n[1]} ${n[2]}</a>`).join('')}<a href="#/" style="margin-top:20px">← Home page</a><a href="#/login" onclick="logout();return false">🚪 Sign out</a></aside><main class=main><div class=top><div class=row><button class="btn ghost sm burger" onclick="$('#side').classList.toggle('open')">☰</button><h2 style="margin:0">${title}</h2></div><div class=row><button class="btn ghost sm" onclick="toggleTheme()">🌓</button><span class=mut>👤 ${esc(DB.user||'Investigator')}</span></div></div>${body}</main></div>`}
function toggleTheme(){const d=document.documentElement;const n=d.dataset.theme=='dark'?'light':'dark';d.dataset.theme=n;localStorageSet('theme',n)}
