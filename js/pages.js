/* ================= PAGES ================= */
const pages={
'':{pub:1,html:()=>`<div class=nav><span class=logo>🛡️ Fake<em>Profile</em> Shield</span><div class=row><a href="#/model">Technology</a><a href="#/team">Team</a><button class="btn ghost sm" onclick="toggleTheme()">🌓</button><a class=btn href="#/login">Investigator Login</a></div></div>
<section class=hero><span class=tag>Major Project · B.Tech CSE (Data Science) · SVVV Indore</span><h1 style="margin-top:14px">Catch <span>fake social media profiles</span> before they cause harm</h1><p>An intelligent platform that uses machine-learning classification to detect suspicious social media profiles and delivers structured investigation reports.</p><div class=row style="justify-content:center"><a class=btn href="#/login">Open Dashboard</a><a class="btn ghost" href="#/analyze" onclick="if(!DB.user){DB.user='Guest Investigator'}">Try a Live Demo</a></div></section>
<section class=sec><h2>Machine learning and investigation reporting</h2><div class="grid g3">
<div class=card><div class=ico>🌲</div><h3>ML Classification</h3><p class=mut>
  Random Forest and Gradient Boosting models evaluate 11
  profile features, including username patterns, profile
  picture, account privacy, description length, posts,
  followers and following.
</p></div>
<div class=card><div class=ico>📑</div><h3>Reporting Dashboard</h3><p class=mut>Unified risk score, evidence, filters and one-click structured case reports (PDF) for crime branches and cyber cells.</p></div></div></section>
<section class=sec><h2>How it works</h2><div class="grid g3 steps"><div class="card step"><b>Ingest</b><p class=mut>Enter a profile or upload a batch list.</p></div><div class="card step"><b>Classify</b><p class=mut>ML models evaluate profile features.</p></div><div class="card step"><b>Report</b><p class=mut>Generate structured investigation reports.</p></div></div></section>
<section class=sec><h2>Built for</h2><div class="grid g4"><div class="card kpi"><b>🚓</b>Crime branches &amp; cyber cells</div><div class="card kpi"><b>🏢</b>Brand protection teams</div><div class="card kpi"><b>🛠️</b>Platform trust &amp; safety</div><div class="card kpi"><b>📈</b>Single lookups to batch screening</div></div></section>
<footer style="text-align:center;padding:30px" class=mut>© 2026 Team G-9 · Shri Vaishnav Institute of Information Technology · Guided by Prof. Kamal Borana</footer>`},
'login': {
  pub: 1,
  html: () => `
    <div class=login>
      <div class=card>
        <div class=logo style="text-align:center;font-size:24px">
          🛡️ Fake<em>Profile</em> Shield
        </div>
        <p class=mut style="text-align:center">Investigator sign-in</p>

        <label>Email</label>
        <input id=em type=email placeholder="officer@cybercell.gov.in">

        <label>Password</label>
        <input id=pw type=password placeholder="••••••••">

        <label>Role</label>
        <select id=role>
          <option>Investigator</option>
          <option>Supervisor</option>
          <option>Admin</option>
        </select>

        <p class=mut style="font-size:12px">
          Sign in using your registered email and password.
        </p>

        <button class=btn style="width:100%;margin-top:18px" onclick="login()">
          Sign in
        </button>
      </div>
    </div>
  `
},
'dashboard':{html:()=>{const L=DB.profiles,h=L.filter(p=>p.risk>=.7).length,m=L.filter(p=>p.risk>=.4&&p.risk<.7).length,lo=L.length-h-m;const plats=[...new Set(L.map(p=>p.platform))];
 return shell('dashboard','Dashboard',`<div class="grid g4"><div class="card kpi"><b id="dash-screened">${L.length}</b><span>Profiles screened</span></div><div class="card kpi"><b id="dash-high" style="color:var(--hi)">${h}</b><span>High risk</span></div><div class="card kpi"><b id="dash-medium" style="color:var(--md)">${m}</b><span>Medium risk</span></div><div class="card kpi"><b id="dash-reports">${DB.reports.length}</b><span>Reports generated</span></div></div>
 <div class="grid g2"><div class=card><h3>Risk distribution</h3>${meter('High',h/L.length)}${meter('Medium',m/L.length)}${meter('Low',lo/L.length)}</div>
 <div class=card><h3>By platform</h3>${plats.map(pl=>{const n=L.filter(p=>p.platform==pl);return `<div style="margin:9px 0"><div class="row sp"><small>${pl}</small><small class=mut>${n.length} profiles · ${n.filter(p=>p.risk>=.7).length} high</small></div><div class=bar><i style="width:${n.length/L.length*100}%;background:var(--pri)"></i></div></div>`}).join('')}</div></div>
 <div class=card><div class="row sp"><h3>Priority queue</h3><a href="#/profiles">View all →</a></div>${profTable([...L].sort((a,b)=>b.risk-a.risk).slice(0,6))}</div>`)}},

'analyze':{html:()=>shell('analyze','Analyze a Profile',`
<div class="grid g2">
  <div class=card>
    <h3>Instagram Profile Details</h3>

    <label>Username</label>
    <input id=a_u placeholder="e.g. official_sbi_help">

    <label>Full Name</label>
    <input id=a_name placeholder="Enter full name">

    <div class="grid" style="grid-template-columns:1fr 1fr;gap:0 12px">

      <div>
        <label>Profile Picture</label>
        <select id=a_pic>
          <option value=1>Available</option>
          <option value=0>Not available</option>
        </select>
      </div>

      <div>
        <label>Private Account</label>
        <select id=a_private>
          <option value=0>Public</option>
          <option value=1>Private</option>
        </select>
      </div>

      <div>
        <label>External URL</label>
        <select id=a_url>
          <option value=0>No</option>
          <option value=1>Yes</option>
        </select>
      </div>

      <div>
        <label>Posts</label>
        <input id=a_po type=number min=0 value=20>
      </div>

      <div>
        <label>Followers</label>
        <input id=a_f type=number min=0 value=500>
      </div>

      <div>
        <label>Following</label>
        <input id=a_g type=number min=0 value=300>
      </div>

    </div>

    <label>Bio / Description</label>
    <textarea id=a_b rows=3
      placeholder="Enter Instagram bio"></textarea>

    <div class=row style="margin-top:14px">
      <button class=btn id=go onclick="runAnalyze()">
        Run Analysis
      </button>
      <button class="btn ghost" onclick="fillDemo()">
        Load Sample
      </button>
    </div>
  </div>

  <div id=res class=card>
    <h3>Analysis Result</h3>
    <p class=mut>
      Enter Instagram profile details to calculate
      the 11 dataset features and predict profile authenticity.
    </p>
  </div>
</div>
`)},
'profiles':{html:()=>shell('profiles','Flagged Profiles',`<div class=card><div class=row><input id=q placeholder="Search username…" style="max-width:260px" oninput="filt()"><select id=fr style="max-width:170px" onchange="filt()"><option value="">All risk levels<option value=high>High<option value=med>Medium<option value=low>Low</select><select id=fp style="max-width:170px" onchange="filt()"><option value="">All platforms<option>Instagram<option>Twitter/X<option>Facebook</select><select id=fs style="max-width:170px" onchange="filt()"><option value="">All statuses<option>Open<option>Escalated<option>Dismissed</select><button class="btn ghost sm" onclick="exportCSV()">⬇ CSV</button></div><div id=tbl style="margin-top:14px">${profTable(DB.profiles)}</div></div>`)},
'batch':{html:()=>shell('batch','Batch Screening',`<div class=card><p class=mut>Paste one username per line or upload a .txt/.csv list. Results appear below and can be added to the queue.</p><textarea id=bl rows=6 placeholder="user_one&#10;user_two&#10;user_three"></textarea><div class=row style="margin-top:12px"><input type=file id=bf accept=".txt,.csv" style="max-width:280px" onchange="loadFile(this)"><button class=btn onclick="runBatch()">Screen accounts</button></div><div id=bp></div></div><div id=br></div>`)},
'reports':{html:()=>shell('reports','Investigation Reports',`<div class=card><div id="reports-list"><p class=mut>Loading reports...</p></div></div>`)},

'model': {
  html: () => {
    const M = [
      ['Random Forest', 91.67, 91.67, 91.67, 91.67],
      ['Gradient Boosting', 90.00, 91.38, 88.33, 89.83]
    ];

    return shell('model', 'Model Insights', `
      <div class=card>
        <h3>Machine Learning Model Comparison</h3>
        <p class=mut>
          Performance evaluation using the new training and testing dataset.
          Test dataset: 120 records.
        </p>
        <div class=wrap>
          <table>
            <thead>
              <tr>
                <th>Model</th>
                <th>Accuracy</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1-score</th>
              </tr>
            </thead>
            <tbody>
              ${M.map(r => `
                <tr>
                  <td><b>${r[0]}</b></td>
                  ${r.slice(1).map(v =>
                    `<td>${v.toFixed(2)}%</td>`
                  ).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid g2">
        <div class=card>
          <h3>Random Forest Confusion Matrix</h3>
          <p class=mut>Actual vs predicted classifications</p>
          <div class="grid" style="grid-template-columns:repeat(2,120px);gap:6px">
            <div class=card style="background:var(--lo);color:#fff;text-align:center;margin:0">
              TN<br><b>55</b>
            </div>
            <div class=card style="background:var(--md);color:#fff;text-align:center;margin:0">
              FP<br><b>5</b>
            </div>
            <div class=card style="background:var(--md);color:#fff;text-align:center;margin:0">
              FN<br><b>5</b>
            </div>
            <div class=card style="background:var(--lo);color:#fff;text-align:center;margin:0">
              TP<br><b>55</b>
            </div>
          </div>
        </div>

        <div class=card>
          <h3>Gradient Boosting Confusion Matrix</h3>
          <p class=mut>Actual vs predicted classifications</p>
          <div class="grid" style="grid-template-columns:repeat(2,120px);gap:6px">
            <div class=card style="background:var(--lo);color:#fff;text-align:center;margin:0">
              TN<br><b>55</b>
            </div>
            <div class=card style="background:var(--md);color:#fff;text-align:center;margin:0">
              FP<br><b>5</b>
            </div>
            <div class=card style="background:var(--md);color:#fff;text-align:center;margin:0">
              FN<br><b>7</b>
            </div>
            <div class=card style="background:var(--lo);color:#fff;text-align:center;margin:0">
              TP<br><b>53</b>
            </div>
          </div>
        </div>
      </div>

      <div class=card>
        <h3>Dataset Features</h3>
        <p class=mut>
          The classification models use these 11 profile features:
        </p>
        <div class="grid g3">
          ${[
            'Profile picture',
            'Numbers in username',
            'Full name words',
            'Numbers in full name',
            'Name matches username',
            'Description length',
            'External URL',
            'Private account',
            'Number of posts',
            'Number of followers',
            'Number of following'
          ].map(f => `<span class=tag>${f}</span>`).join('')}
        </div>
      </div>
    `);
  }
},
'team':{html:()=>shell('team','Project & Team',`<div class=card><h3>Fake Social Media Profile Detection and Reporting System</h3><p class=mut>Team ID G-9 · Guide: Prof. Kamal Borana · Dept. of CSE, Shri Vaishnav Institute of Information Technology, SVVV Indore · Jul–Dec 2026</p></div>
 <div class="grid g4">${[['Paridhi Agrawal','23100BTCSDSI14379','Backend'],['Prakrati Dubey','23100BTCSDSI14381','Frontend'],['Pratha Singh Naruka','23100BTCSDSI14383','Team member'],['Priyanshu Salunkhe','23100BTCSDSI14386','Team member']].map(t=>`<div class=card style="text-align:center"><div class=ico>🎓</div><b>${t[0]}</b><br><small class=mut>${t[1]}</small><br><span class=tag>${t[2]}</span></div>`).join('')}</div>
 <div class="grid g2"><div class=card><h3>Status – Sprint 1 of 6</h3><p>Requirements &amp; Design (Weeks 1–2) · <span class="pill low">On track</span></p>${meter('Sprint 1 progress',.5)}<p class=mut>Jira board and Git repo set up; Use Case Diagram is next. CI/CD (GitHub Actions) planned for Week 9.</p></div>
 <div class=card><h3>Tech stack</h3>${['Python','Flask','scikit-learn','pandas / NumPy','MySQL','HTML','CSS','JavaScript','GitHub'].map(t=>`<span class=tag>${t}</span>`).join('')}</div></div>
 <div class=card><h3>Objectives</h3><ul><li>Detect fake / impersonating profiles with high accuracy<li>Evaluate profile features using machine-learning models<li>Generate structured, exportable investigation reports<li>Provide an investigator dashboard to review, filter and act on flagged profiles</ul></div>`)},
'settings':{html:()=>shell('settings','Settings',`<div class="grid g2"><div class=card><h3>Backend connection</h3><label>API base URL</label><input id=api value="${esc(CFG.API_BASE)}"><label>Mode</label><select id=mode><option value=1 ${CFG.USE_MOCK?'selected':''}>Mock data (demo)<option value=0 ${CFG.USE_MOCK?'':'selected'}>Live backend</select><button class=btn style="margin-top:14px" onclick="saveCfg()">Save</button></div>
 <div class=card><h3>Risk thresholds</h3><label>High risk ≥ <b id=t1v>70</b>%</label><input type=range min=50 max=95 value=70 oninput="t1v.textContent=this.value"><label>Medium risk ≥ <b id=t2v>40</b>%</label><input type=range min=10 max=60 value=40 oninput="t2v.textContent=this.value"><p class=mut style="font-size:12px">Demo controls. Wire to backend config when available.</p></div></div>`)}
};
