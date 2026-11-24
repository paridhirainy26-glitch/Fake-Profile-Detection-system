/* ================= ROUTER ================= */
async function route() {
  const h = (location.hash || '#/').slice(2).split('/');
  const k = h[0];

  let html;
  const pg = pages[k];

  if (k === 'profile') {
    if (!DB.user) {
      location.hash = '#/login';
      return;
    }

    try {
      const result = await API.getProfiles();

      DB.profiles = (result.profiles || []).map(row => {
        const probability = Number(row.fake_probability ?? 0);

        return {
          id: row.id,
          username: row.username || `profile-${row.id}`,
          full_name: row.full_name || '',
          platform: 'Instagram',
          followers: row.followers,
          following: row.following,
          posts: row.posts,
          risk: probability,
          ml: probability,
          llm: 0,
          verdict: 'Not enabled',
          flags: [],
          rationale: 'Random Forest model prediction.',
          features: [],
          status: 'Open',
          date: row.created_at
            ? new Date(row.created_at).toLocaleDateString()
            : '-'
        };
      });

      html = detail(h[1]);

    } catch (error) {
      console.error('Could not load profile:', error);
      html = shell('profiles', 'Error', '<div class="card">Could not load profile from backend.</div>');
    }

  } else if (k === 'report') {
    html = DB.user ? reportView(h[1]) : null;

  } else if (pg) {
    html = (pg.pub || DB.user) ? pg.html() : null;

  } else {
    location.hash = '#/';
    return;
  }

  if (html === null) {
    location.hash = '#/login';
    return;
  }

  $('#app').innerHTML = html;
  window.scrollTo(0, 0);

  if (k === 'reports') loadReports();
  if (k === 'dashboard') loadDashboardStats();
  if (k === 'profiles') loadProfilesFromBackend();
}

document.documentElement.dataset.theme=localStorageGet('theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
window.addEventListener('hashchange',route);route();
