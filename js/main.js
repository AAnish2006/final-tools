/**
 * DevToolBox - Core Vanilla JavaScript
 */

// Mobile Navigation Hamburger Toggle
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.nav');

  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('nav-open');
      hamburger.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', isOpen);
    });

    // Close mobile nav when clicking outside
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !hamburger.contains(e.target) && nav.classList.contains('nav-open')) {
        nav.classList.remove('nav-open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', false);
      }
    });
  }

  // FAQ Accordion Toggle
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        // Close all other items
        faqItems.forEach(i => i.classList.remove('active'));
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });

  // Blog Category Filter
  const blogCategories = document.querySelector('.blog-categories');
  if (blogCategories) {
    const categoryBtns = blogCategories.querySelectorAll('.category-btn');
    const blogCards = document.querySelectorAll('.blog-grid .blog-card');

    categoryBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedCat = btn.textContent.trim();

        // Update active class & aria-selected
        categoryBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        // Filter articles
        blogCards.forEach(card => {
          if (selectedCat === 'All') {
            card.style.display = '';
          } else {
            const cardTag = card.querySelector('.blog-category-tag');
            const catText = cardTag ? cardTag.textContent.trim() : '';
            if (catText.toLowerCase() === selectedCat.toLowerCase()) {
              card.style.display = '';
            } else {
              card.style.display = 'none';
            }
          }
        });
      });
    });
  }

  // Initialize AdSense slots safely
  try {
    const ads = document.querySelectorAll('.adsbygoogle');
    ads.forEach(() => {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    });
  } catch (err) {
    // Suppress AdSense local or duplicate load warnings
  }
});

// Toast / Notification helper
function showToast(message, type = 'success') {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0f172a;
      color: #fff;
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      font-size: 0.95rem;
      font-weight: 600;
      z-index: 9999999;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.25s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-left: 4px solid #10b981;
    `;
    document.body.appendChild(toast);
  }

  toast.style.borderLeftColor = type === 'error' ? '#ef4444' : '#10b981';
  toast.innerHTML = `${type === 'error' ? '⚠️' : '✓'} ${message}`;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
  }, 2200);
}

// Copy text utility with fallback
async function copyToClipboard(text, successMsg = 'Copied to clipboard!') {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMsg);
  } catch (err) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(successMsg);
  }
}
