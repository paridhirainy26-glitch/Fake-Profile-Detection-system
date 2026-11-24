/* ================= ACTIONS ================= */

async function login() {
  const email = $('#em').value.trim();
  const password = $('#pw').value;

  if (!email || !password) {
    toast('Please enter email and password.');
    return;
  }

  try {
    const response = await API.login(email, password);
    const user = response.user;

    if (!response.token) {
      toast('Login failed: authentication token missing.');
    return;
  }

localStorageSet('token', response.token);


    DB.user = user.name;
    localStorageSet('user', user.name);
    localStorageSet('email', user.email);
    localStorageSet('role', user.role);

    location.hash = '#/dashboard';
  } catch (error) {
    toast(error.message || 'Login failed. Check your credentials.');
  }
}
function saveCfg(){CFG.API_BASE=$('#api').value;CFG.USE_MOCK=$('#mode').value=='1';localStorageSet('api',CFG.API_BASE);toast('Settings saved')}
function fillDemo() {
  $('#a_u').value = 'official_sbi_help';
  $('#a_name').value = 'SBI Help';
  $('#a_pic').value = '1';
  $('#a_private').value = '0';
  $('#a_url').value = '1';

  $('#a_po').value = 3;
  $('#a_f').value = 95;
  $('#a_g').value = 1800;

  $('#a_b').value = 'Official support page. DM for loan help';
}

async function runAnalyze() {
  const username = $('#a_u').value.trim();
  const fullName = $('#a_name').value.trim();
  const bio = $('#a_b').value;

  if (!username) {
    return toast('Enter a username.');
  }

  if (!fullName) {
    return toast('Enter the full name.');
  }

  const profile = {
    username: username,
    full_name: fullName,
    "profile pic": Number($('#a_pic').value),

    "nums/length username":
      (username.match(/\d/g) || []).length / username.length,

    "fullname words":
      fullName.split(/\s+/).filter(Boolean).length,

    "nums/length fullname":
      (fullName.match(/\d/g) || []).length / fullName.length,

    "name==username":
      fullName.toLowerCase() === username.toLowerCase() ? 1 : 0,

    "description length": bio.length,

    "external URL": Number($('#a_url').value),

    "private": Number($('#a_private').value),

    "#posts": Number($('#a_po').value),

    "#followers": Number($('#a_f').value),

    "#follows": Number($('#a_g').value),

    "model": "random_forest"
  };

  const go = $('#go');
  go.disabled = true;
  go.textContent = 'Analyzing...';

  try {
    const r = await API.predict(profile);

    const fakeProbability = Number(r.fake_probability);
    const predictedRisk = fakeProbability;

    window._last = {
      id: r.prediction_id,
      prediction_id: r.prediction_id,
      username: username,
      full_name: fullName,
      platform: 'Instagram',
      followers: profile['#followers'],
      following: profile['#follows'],
      posts: profile['#posts'],
      bio: bio,
      risk: predictedRisk,
      ml: predictedRisk,
      features: [],
      status: 'Open',
      date: new Date().toLocaleDateString()
    };

    const resultLabel = r.predicted_label || 'Prediction completed';
    const percentage = (fakeProbability * 100).toFixed(2);

    $('#res').innerHTML = `
      <h3>Result for @${esc(username)}</h3>

      <div class="card">
        <h3>${esc(resultLabel)}</h3>

        <p>
          Fake probability:
          <b>${percentage}%</b>
        </p>

        <div class="bar">
          <i style="width:${Math.min(100, Math.max(0, fakeProbability * 100))}%;background:var(--pri)"></i>
        </div>

        <p class="mut">
          Model: Random Forest
        </p>

        <p class="mut">
          Prediction ID: ${r.prediction_id}
        </p>
      </div>

      <h3 style="margin-top:16px">Submitted profile features</h3>

      <table>
        <tr><td>Profile picture</td><td>${profile['profile pic']}</td></tr>
        <tr><td>Username digit ratio</td><td>${profile['nums/length username'].toFixed(2)}</td></tr>
        <tr><td>Full name words</td><td>${profile['fullname words']}</td></tr>
        <tr><td>Full name digit ratio</td><td>${profile['nums/length fullname'].toFixed(2)}</td></tr>
        <tr><td>Name equals username</td><td>${profile['name==username']}</td></tr>
        <tr><td>Description length</td><td>${profile['description length']}</td></tr>
        <tr><td>External URL</td><td>${profile['external URL']}</td></tr>
        <tr><td>Private account</td><td>${profile['private']}</td></tr>
        <tr><td>Posts</td><td>${profile['#posts']}</td></tr>
        <tr><td>Followers</td><td>${profile['#followers']}</td></tr>
        <tr><td>Following</td><td>${profile['#follows']}</td></tr>
      </table>

      <p class="mut">
        This result is an ML prediction, not a confirmation that an account is fake.
      </p>
    `;

  } catch (error) {
    console.error('Profile analysis failed:', error);
    toast('Analysis failed: ' + error.message);
  } finally {
    go.disabled = false;
    go.textContent = 'Run analysis';
  }
}
function saveLast() {
  const p = window._last;

  if (!p) {
    return toast('No prediction available.');
  }

  if (DB.profiles.some(x => x.id == p.id)) {
    return toast('This prediction is already saved.');
  }

  DB.profiles.unshift(p);

  localStorageSet('profiles', JSON.stringify(DB.profiles));

  toast('Profile added to the local queue.');

  location.hash = '#/profiles';
}
function filt(){const q=$('#q').value.toLowerCase(),r=$('#fr').value,pl=$('#fp').value,s=$('#fs').value;
 $('#tbl').innerHTML=profTable(DB.profiles.filter(p=>p.username.toLowerCase().includes(q)&&(!r||cls(p.risk)==r)&&(!pl||p.platform==pl)&&(!s||p.status==s)))}
function exportCSV() {
  const headers = [
    'username',
    'platform',
    'followers',
    'following',
    'posts',
    'risk',
    'status'
  ];

  const rows = DB.profiles.map(p => [
    p.username,
    p.platform,
    p.followers,
    p.following,
    p.posts,
    Number(p.risk).toFixed(2),
    p.status
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row =>
      row.map(value =>
        `"${String(value ?? '').replace(/"/g, '""')}"`
      ).join(',')
    )
  ].join('\n');

  dl('profiles.csv', csv, 'text/csv');
}
function dl(n,c,t){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([c],{type:t}));a.download=n;a.click()}
function loadFile(i){const f=i.files[0];if(!f)return;const r=new FileReader();r.onload=()=>$('#bl').value=r.result.split(/[\r\n,]+/).filter(Boolean).join('\n');r.readAsText(f)}
async function runBatch(){const n=$('#bl').value.split('\n').map(s=>s.trim()).filter(Boolean);if(!n.length)return toast('Add at least one username');
 $('#bp').innerHTML='<p class=mut>Screening '+n.length+' accounts…</p><div class=bar><i style="width:100%;background:var(--pri)"></i></div>';
 const res=await API.batch(n);window._batch=res;$('#bp').innerHTML='';
 $('#br').innerHTML=`<div class=card><div class="row sp"><h3>${res.length} accounts screened · ${res.filter(p=>p.risk>=.7).length} high risk</h3><button class=btn onclick="DB.profiles.unshift(...window._batch);toast('Added to queue');location.hash='#/profiles'">Add all to queue</button></div>${profTable(res,false)}</div>`}

function detail(id) {
  const p = DB.profiles.find(x => x.id == id);

  if (!p) {
    return shell('profiles', 'Not found',
      '<div class=card>Profile not found.</div>');
  }

  return shell('profiles', '@' + esc(p.username), `
    <div class="grid g2">
      <div class="card">
        <div class="row sp">
          <div>${gauge(p.risk, 'ML risk')}</div>
          <div style="flex:1;min-width:200px">
            <p>${risk(p.risk)}
              <span class="pill n">${p.status}</span>
            </p>
            <p class="mut">${p.platform} · flagged ${p.date}</p>())
            ${meter('ML score', p.ml)}
          </div>
        </div>

        <div class="row" style="margin-top:14px">
          <button class="btn red"
            onclick="generateReport(${p.id})">Generate report</button>
          <button class="btn"
            onclick="setStatus(${p.id},'Escalated')">Escalate</button>
          <button class="btn ghost"
            onclick="setStatus(${p.id},'Dismissed')">Dismiss</button>
          <button class="btn ghost"
            onclick="setStatus(${p.id},'Open')">Reopen</button>
        </div>
      </div>

      <div class="card">
        <h3>Profile facts</h3>
        <table>
          ${[
            ['Followers', p.followers],
            ['Following', p.following],
            ['Posts', p.posts],
            ['Bio', p.bio || '— empty —']
          ].map(r =>
            `<tr><td class="mut">${r[0]}</td><td>${esc(r[1])}</td></tr>`
          ).join('')}
        </table>
      </div>
    </div>

    <div class="card">
      <h3>Machine Learning Assessment</h3>
      <p class="mut">
        This assessment is based on the selected machine-learning model.
      </p>
    </div>
  `);
}

async function setStatus(id, s) {
  const p = DB.profiles.find(x => x.id == id);

  if (!p) {
    return toast('Profile not found.');
  }

  try {
    await API.updateStatus(p.prediction_id ?? p.id, s);

    p.status = s;

    localStorageSet('profiles', JSON.stringify(DB.profiles));

    toast('Status updated: ' + s);

    route();

  } catch (error) {
    console.error('Status update failed:', error);
    toast('Could not update status: ' + error.message);
  }
}
function reportView(id){const r=DB.reports.find(x=>x.id==id);if(!r)return shell('reports','Report','<div class=card>Report not found.</div>');const p=r.profile;
 return shell('reports','Report '+r.id,`<div class="row noprint" style="margin-bottom:14px"><button class=btn onclick="window.print()">🖨 Print / Save as PDF</button><button class="btn ghost" onclick="dl('${r.id}.json',JSON.stringify(DB.reports.find(x=>x.id=='${r.id}'),null,2),'application/json')">⬇ JSON</button></div>
 <div class=card><h2>Investigation Report – ${r.id}</h2><p class=mut>Generated ${r.created} · FakeProfile Shield · Team G-9</p><h3>Subject</h3><p>@${esc(p.username)} on ${p.platform}</p><h3>Assessment</h3><p>${risk(p.risk)} — ML ${pct(p.ml)}</p><h3>Behavioural evidence</h3><ul>${p.features.map(f=>`<li>${f[0]}: ${pct(f[1])} contribution`).join('')}</ul><h3>Recommended action</h3><p>${p.risk>=.7?'Escalate for takedown request and preserve evidence.':p.risk>=.4?'Manual review recommended.':'No action required.'}</p></div>`)}
async function generateReport(profileId) {
  const p = DB.profiles.find(x => x.id == profileId);

  if (!p) {
    return toast('Profile not found');
  }

  try {
    const report = await makeReport(p);
    location.hash = '#/report/' + report.id;
  } catch (error) {
    toast('Could not generate report: ' + error.message);
  }
}

async function loadReports() {
  const container = document.getElementById('reports-list');
  if (!container) return;

  container.innerHTML = '<p class="mut">Loading reports...</p>';

  try {
    const result = await API.getReports();
    const reports = result.reports || [];

    if (!reports.length) {
      container.innerHTML = '<p class="mut">No reports found in the backend yet.</p>';
      return;
    }

    container.innerHTML = `
      <div class="wrap">
        <table>
          <thead>
            <tr><th>ID</th><th>Prediction ID</th><th>Reason</th><th>Status</th><th>Created</th></tr>
          </thead>
          <tbody>
            ${reports.map(r => `
              <tr>
                <td><b>${r.id}</b></td>
                <td>${r.prediction_id}</td>
                <td>${r.reason || '-'}</td>
                <td>${r.status || 'pending'}</td>
                <td>${r.created_at || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (error) {
    container.innerHTML =
      '<p>Could not load reports from the backend. Check that Flask is running.</p>';
    console.error('Load reports failed:', error);
  }
}

async function loadDashboardStats() {
  try {
    const [profileResult, reportResult] = await Promise.all([
      API.getProfiles(),
      API.getReports()
    ]);

    const profiles = profileResult.profiles || [];
    const reports = reportResult.reports || [];

    const getRisk = p => {
      const value = Number(p.fake_probability ?? p.risk ?? 0);
      return value > 1 ? value / 100 : value;
    };

    const high = profiles.filter(p => getRisk(p) >= 0.7).length;

    const medium = profiles.filter(p => {
      const risk = getRisk(p);
      return risk >= 0.4 && risk < 0.7;
    }).length;

    document.getElementById('dash-screened').textContent =
      profiles.length;

    document.getElementById('dash-high').textContent = high;

    document.getElementById('dash-medium').textContent = medium;

    document.getElementById('dash-reports').textContent =
      reports.length;

  } catch (error) {
    console.error('Dashboard statistics failed:', error);
  }
}

function logout() {
  localStorage.removeItem('user');
  localStorage.removeItem('email');
  localStorage.removeItem('role');
  localStorage.removeItem('token');

  DB.user = null;
  location.hash = '#/login';
}
async function loadProfilesFromBackend() {
  const table = document.getElementById('tbl');
  if (!table) return;

  table.innerHTML = '<p class="mut">Loading profiles...</p>';

  try {
    const result = await API.getProfiles();

    DB.profiles = (result.profiles || []).map(row => {
      const probability = Number(row.fake_probability ?? 0);

      return {
        id: row.id,
        prediction_id: row.id,
        username: row.username || `profile-${row.id}`,
        full_name: row.full_name || '',
        platform: 'Instagram',
        followers: row.followers,
        following: row.following,
        posts: row.posts,
        risk: probability,
        ml: probability,
        features: [],
        status: row.status ||'Open',
        date: row.created_at
          ? new Date(row.created_at).toLocaleDateString()
          : '-'
      };
    });

    filt();

  } catch (error) {
    console.error('Could not load profiles:', error);
    table.innerHTML =
      '<p class="mut">Could not load profiles. Check the backend connection.</p>';
  }
}