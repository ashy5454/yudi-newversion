/**
 * Yudi Labs - Global Animations Script
 * Includes: Neural Network Canvas Background & IntersectionObserver for Scroll Animations
 */

function init() {
    initCanvasBackground();
    initScrollAnimations();
    initMobileMenu();
    initThemeToggle();
    
    // Dynamically inject chatbot widget
    if (!document.getElementById('yudi-chatbot-script') && window.location.pathname !== '/admin-dashboard' && window.location.pathname !== '/admin-dashboard.html') {
        const chatScript = document.createElement('script');
        chatScript.id = 'yudi-chatbot-script';
        chatScript.src = 'assets/chatbot.js';
        document.body.appendChild(chatScript);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// --- Scroll Fade-Up Animations ---
function initScrollAnimations() {
    // Add 'fade-up' class to major elements if they don't already have it
    const elementsToAnimate = document.querySelectorAll(
        '.content-section h2, .content-section p, .content-section .grid-2, .content-section .grid-3, .card, .product-card, .solution-card, .pub-card, .blog-card, .team-card, .role-card, .timeline-item, .list-box, .warning-box, .program-card'
    );

    elementsToAnimate.forEach(el => {
        if (!el.classList.contains('fade-up')) {
            el.classList.add('fade-up');
        }
    });

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1 // Trigger when 10% of element is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing once it's visible if we only want it to animate once
                // observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-up').forEach(el => {
        observer.observe(el);
    });
}


// --- Neural Network Canvas Background ---
function initCanvasBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    let width, height;
    let particles = [];
    
    // Config
    const particleCount = window.innerWidth < 900 ? 25 : 70;
    const connectionDistance = 150;
    const mouseRadius = 200;
    
    let mouse = {
        x: null,
        y: null
    };

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    window.addEventListener('resize', resize);
    resize();

    // Track mouse
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });

    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.baseRadius = Math.random() * 1.5 + 0.5;
            this.radius = this.baseRadius;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off edges
            if (this.x < 0 || this.x > width) this.vx = -this.vx;
            if (this.y < 0 || this.y > height) this.vy = -this.vy;

            // Mouse interaction
            if (mouse.x != null && mouse.y != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouseRadius) {
                    // Push particles away slightly
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (mouseRadius - distance) / mouseRadius;
                    
                    this.x -= forceDirectionX * force * 2;
                    this.y -= forceDirectionY * force * 2;
                }
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            ctx.fillStyle = isLight ? 'rgba(15, 23, 42, 0.35)' : 'rgba(255, 255, 255, 0.35)';
            ctx.fill();
        }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    // Performance Optimization: Pause loop when canvas is off-screen
    let isCanvasVisible = true;
    if (typeof IntersectionObserver !== 'undefined') {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isCanvasVisible = entry.isIntersecting;
            });
        }, { threshold: 0.001 });
        observer.observe(canvas);
    }

    function animate() {
        requestAnimationFrame(animate);
        if (!isCanvasVisible) return;
        
        ctx.clearRect(0, 0, width, height);

        particles.forEach(p => p.update());

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                let dx = particles[i].x - particles[j].x;
                let dy = particles[i].y - particles[j].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < connectionDistance) {
                    let opacity = 1 - (distance / connectionDistance);
                    ctx.beginPath();
                    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
                    ctx.strokeStyle = isLight ? `rgba(15, 23, 42, ${opacity * 0.15})` : `rgba(255, 255, 255, ${opacity * 0.15})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        particles.forEach(p => p.draw());
    }

    animate();
}

// --- Mobile Navigation Menu Handler ---
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = menuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
            menuBtn.setAttribute('aria-expanded', isActive);
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
                menuBtn.classList.remove('active');
                navLinks.classList.remove('active');
                menuBtn.setAttribute('aria-expanded', false);
            }
        });

        // Close menu on link clicks
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menuBtn.classList.remove('active');
                navLinks.classList.remove('active');
                menuBtn.setAttribute('aria-expanded', false);
            });
        });
    }
}

// --- Theme Toggle Listener Handler ---
function initThemeToggle() {
    // Locate the navigation links container
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;
    
    // Check if the toggle button already exists
    let toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) {
        toggleBtn = document.createElement('button');
        toggleBtn.id = 'theme-toggle';
        toggleBtn.className = 'theme-toggle-btn';
        toggleBtn.setAttribute('aria-label', 'Toggle theme');
        toggleBtn.innerHTML = `
            <svg class="sun-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41M17.66 17.66l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
            <svg class="moon-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
            </svg>
        `;
        navLinks.appendChild(toggleBtn);
    }
    
    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}
