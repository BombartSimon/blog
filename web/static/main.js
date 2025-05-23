function timeAgo(ts) {
  if (!ts) return '';
  const now = Date.now() / 1000;
  const diff = Math.floor(now - ts);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  const d = new Date(ts * 1000);
  return d.toLocaleDateString();
}

async function fetchSession() {
  const res = await fetch('/users/me');
  if (!res.ok) return null;
  return (await res.json()).user;
}
function renderAuthLinks(user) {
  const authDiv = document.getElementById('auth-links');
  if (user) {
    authDiv.innerHTML = `<span>Logged in as <b>${user.name}</b></span> <button id='logoutBtn'>Logout</button>`;
    document.getElementById('logoutBtn').onclick = async () => {
      await fetch('/logout', { method: 'POST' });
      document.cookie = 'session=; Max-Age=0; path=/;';
      location.reload();
    };
  } else {
    authDiv.innerHTML = `<a href='/login.html'>Login</a> | <a href='/signup.html'>Sign Up</a>`;
  }
}
async function fetchPosts() {
  const res = await fetch('/posts');
  const data = await res.json();
  return data.posts || [];
}
async function fetchComments(postId) {
  const res = await fetch(`/comments?post_id=${postId}`);
  const data = await res.json();
  return data.comments || [];
}
// Helper to linkify URLs in text
function linkify(text) {
  if (!text) return '';
  return text.replace(/(https?:\/\/[^\s]+)/g, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
}
async function renderFeed() {
  const feed = document.getElementById('feed');
  feed.innerHTML = '';
  let posts = await fetchPosts();
  // Sort posts by created_at descending (reverse chronological)
  posts.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
  for (const post of posts) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post';
    let linkPreviewHtml = '';
    if (post.link_preview && post.link_preview.url) {
      linkPreviewHtml = `
        <div class="link-preview" style="border:1px solid #ddd;border-radius:6px;padding:0.5em;margin-bottom:0.5em;background:#fff;display:flex;gap:1em;align-items:center;">
          ${post.link_preview.image ? `<img src="${post.link_preview.image}" alt="preview image" style="max-width:80px;max-height:80px;border-radius:4px;object-fit:cover;">` : ''}
          <div style="flex:1;min-width:0;">
            <div style="font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${post.link_preview.title || post.link_preview.url}</div>
            <div style="color:#555;font-size:0.95em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${post.link_preview.description || ''}</div>
            <a href="${post.link_preview.url}" target="_blank" style="color:#1a0dab;font-size:0.95em;word-break:break-all;">${post.link_preview.url}</a>
          </div>
        </div>
      `;
    }
    postDiv.innerHTML = `
      <div class="post-title">${post.title} <span style='font-size:0.9em;color:#888;'>by <a href="/@${encodeURIComponent(post.author_name ? post.author_name : 'unknown')}">${post.author_name ? post.author_name : 'unknown'}</a>${post.created_at ? ' • ' + timeAgo(post.created_at) : ''}</span></div>
      <div class="post-content">${linkify(post.content)}</div>
      ${linkPreviewHtml}
      <div class="comments" id="comments-${post.id}"></div>
      <form class="comment-form" data-post-id="${post.id}">
        <input type="text" placeholder="Add a comment..." required />
        <button type="submit">Comment</button>
      </form>
    `;
    feed.appendChild(postDiv);
    renderComments(post.id);
    postDiv.querySelector('.comment-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = e.target.querySelector('input');
      const content = input.value;
      await fetch('/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, post_id: post.id })
      });
      input.value = '';
      renderComments(post.id);
    });
  }
}
async function renderComments(postId) {
  const commentsDiv = document.getElementById(`comments-${postId}`);
  const comments = await fetchComments(postId);
  commentsDiv.innerHTML = comments.map(c => `<div class="comment">${linkify(c.content)} <span style='color:#888;'>by <a href="/@${encodeURIComponent(c.author_name ? c.author_name : 'unknown')}">${c.author_name ? c.author_name : 'unknown'}</a>${c.created_at ? ' • ' + timeAgo(c.created_at) : ''}</span></div>`).join('');
}

// == Post Form ==
const postForm = document.getElementById('postForm');
if (postForm) {
  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    await fetch('/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });
    document.getElementById('title').value = '';
    document.getElementById('content').value = '';
    renderFeed();
  });
}


fetchSession().then(user => {
  renderAuthLinks(user);
  renderFeed();
});

// == Signup Form ==
document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName').value;
      const email = document.getElementById('signupEmail').value;
      const password = document.getElementById('signupPassword').value;
      const errorDiv = document.getElementById('signupError');
      errorDiv.textContent = '';
      try {
        const res = await fetch('/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        if (!res.ok) {
          const data = await res.json();
          errorDiv.textContent = data.error || 'Signup failed';
          return;
        }
        location.href = '/';
      } catch (err) {
        errorDiv.textContent = 'Network error';
      }
    });
  }
});

// == Login Form ==
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const errorDiv = document.getElementById('loginError');

      console.log('Login form submitted', { email, password });
      errorDiv.textContent = '';
      try {
        const res = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
          const data = await res.json();
          errorDiv.textContent = data.error || 'Login failed';
          return;
        }
        location.href = '/';
      } catch (err) {
        errorDiv.textContent = 'Network error';
      }
    });
  }
});
