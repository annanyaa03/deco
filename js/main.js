/**
 * DECO MINI - Main Application Script
 * Global UI helpers, responsive navigation, and active link management
 */

document.addEventListener("DOMContentLoaded", () => {
  // Mobile Navigation Menu Toggle
  const menuToggle = document.querySelector(".mobile-menu-toggle");
  const mainNav = document.querySelector(".main-nav");

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      mainNav.classList.toggle("open");
      const isOpen = mainNav.classList.contains("open");
      menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Close menu when clicking outside or clicking a nav link
    document.addEventListener("click", (e) => {
      if (!mainNav.contains(e.target) && !menuToggle.contains(e.target)) {
        mainNav.classList.remove("open");
      }
    });

    mainNav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("open");
      });
    });
  }

  // Active Link Indication based on URL
  const currentPath = window.location.pathname.toLowerCase();
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (!href) return;
    
    // Check if landing page or specific section
    if ((currentPath.endsWith("index.html") || currentPath.endsWith("/") || currentPath === "") && href.includes("index.html")) {
      link.classList.add("active");
    } else if (href.includes("pages/") && currentPath.includes(href.split("/").pop())) {
      link.classList.add("active");
    }
  });

  // Smooth anchor scrolling
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});

