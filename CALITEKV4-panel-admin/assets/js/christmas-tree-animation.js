/**
 * Animation SVG de Noël - Sapin au centre avec particules
 * Version améliorée avec animation fluide
 */

(function() {
  'use strict';

  let treeAnimationInitialized = false;
  let particles = [];
  let animationFrame = null;

  function initChristmasTreeAnimation() {
    // Vérifier si le thème Noël est actif
    if (!document.body.classList.contains('holiday-christmas')) {
      return;
    }

    // Éviter la double initialisation
    if (treeAnimationInitialized) {
      return;
    }

    // Créer le conteneur SVG
    const container = document.createElement('div');
    container.id = 'christmasTreeContainer';
    container.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:90%;height:90%;max-width:600px;max-height:600px;z-index:1;pointer-events:none;display:flex;align-items:center;justify-content:center;';
    document.body.appendChild(container);

    // SVG du sapin
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 400 500');
    svg.setAttribute('class', 'mainSVG');
    svg.style.cssText = 'width:100%;height:100%;visibility:visible;transform:translateY(15%);';
    container.appendChild(svg);

    // Définir le SVG avec un sapin ultra-réaliste en 3D
    svg.innerHTML = `
      <defs>
        <style>
          @font-face {
            font-family: 'mountains_of_christmasregular';
            src: url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/35984/mountainsofchristmas-webfont.woff2') format('woff2'),
                 url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/35984/mountainsofchristmas-webfont.woff') format('woff');
            font-weight: normal;
            font-style: normal;
          }
        </style>
        <!-- Gradients améliorés pour un effet 3D réaliste -->
        <linearGradient id="treeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#0d3d0d;stop-opacity:1" />
          <stop offset="20%" style="stop-color:#1a5f1a;stop-opacity:1" />
          <stop offset="40%" style="stop-color:#228b22;stop-opacity:1" />
          <stop offset="60%" style="stop-color:#2d8f2d;stop-opacity:1" />
          <stop offset="80%" style="stop-color:#32cd32;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#3cb371;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="treeGradientDark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#0a2e0a;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#1a5f1a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#228b22;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="treeGradientLight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#2d8f2d;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#32cd32;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#90ee90;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="potGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#3d2817;stop-opacity:1" />
          <stop offset="30%" style="stop-color:#654321;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#8b4513;stop-opacity:1" />
          <stop offset="70%" style="stop-color:#654321;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#5d3317;stop-opacity:1" />
        </linearGradient>
        <radialGradient id="ornamentRed" cx="30%" cy="30%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
          <stop offset="20%" style="stop-color:#ff6b6b;stop-opacity:1" />
          <stop offset="70%" style="stop-color:#c41e3a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8b0000;stop-opacity:1" />
        </radialGradient>
        <radialGradient id="ornamentGold" cx="30%" cy="30%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
          <stop offset="20%" style="stop-color:#ffd700;stop-opacity:1" />
          <stop offset="70%" style="stop-color:#ff8c00;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#daa520;stop-opacity:1" />
        </radialGradient>
        <radialGradient id="ornamentBlue" cx="30%" cy="30%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
          <stop offset="20%" style="stop-color:#87ceeb;stop-opacity:1" />
          <stop offset="70%" style="stop-color:#4169e1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0000cd;stop-opacity:1" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="treeShadow3D">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
          <feOffset dx="2" dy="4" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <!-- Ombre portée du sapin -->
      <ellipse cx="200" cy="450" rx="100" ry="15" fill="#000" opacity="0.4" filter="url(#treeShadow3D)"/>
      <!-- Pot du sapin (tronc) avec ombre et effet 3D -->
      <ellipse cx="200" cy="450" rx="28" ry="10" fill="#000" opacity="0.4"/>
      <rect class="treePotMask" x="172" y="400" width="56" height="60" fill="url(#potGradient)" rx="10" ry="10"/>
      <rect x="172" y="400" width="56" height="60" fill="none" stroke="#3d2817" stroke-width="2" rx="10" ry="10"/>
      <rect x="175" y="400" width="50" height="8" fill="#5d3317" rx="5" opacity="0.6"/>
      <!-- Tronc du sapin -->
      <rect x="195" y="360" width="10" height="40" fill="#654321" rx="2"/>
      <rect x="197" y="360" width="6" height="40" fill="#8b4513" rx="1"/>
      <!-- Branches du sapin ultra-réalistes avec formes organiques -->
      <!-- Branche supérieure (petite) -->
      <path class="treePathMask" d="M200,50 L250,110 L200,110 L150,110 Z" fill="url(#treeGradientLight)" stroke="#0d3d0d" stroke-width="2" opacity="0.95" filter="url(#treeShadow3D)"/>
      <path class="treePathMask" d="M200,55 L235,100 L200,100 L165,100 Z" fill="url(#treeGradient)" stroke="#1a5f1a" stroke-width="1.5" opacity="0.9"/>
      <!-- Branche 2 -->
      <path class="treePathMask" d="M200,95 L265,170 L200,170 L135,170 Z" fill="url(#treeGradient)" stroke="#0d3d0d" stroke-width="2.5" opacity="0.95" filter="url(#treeShadow3D)"/>
      <path class="treePathMask" d="M200,105 L250,160 L200,160 L150,160 Z" fill="url(#treeGradientLight)" stroke="#1a5f1a" stroke-width="1.5" opacity="0.85"/>
      <!-- Branche 3 -->
      <path class="treePathMask" d="M200,155 L280,250 L200,250 L120,250 Z" fill="url(#treeGradient)" stroke="#0d3d0d" stroke-width="3" opacity="0.95" filter="url(#treeShadow3D)"/>
      <path class="treePathMask" d="M200,165 L265,240 L200,240 L135,240 Z" fill="url(#treeGradientLight)" stroke="#1a5f1a" stroke-width="2" opacity="0.85"/>
      <!-- Branche 4 -->
      <path class="treePathMask" d="M200,225 L290,335 L200,335 L110,335 Z" fill="url(#treeGradient)" stroke="#0d3d0d" stroke-width="3.5" opacity="0.95" filter="url(#treeShadow3D)"/>
      <path class="treePathMask" d="M200,235 L275,325 L200,325 L125,325 Z" fill="url(#treeGradientLight)" stroke="#1a5f1a" stroke-width="2.5" opacity="0.85"/>
      <!-- Branche 5 (la plus basse) -->
      <path class="treePathMask" d="M200,315 L300,390 L200,390 L100,390 Z" fill="url(#treeGradientDark)" stroke="#0d3d0d" stroke-width="4" opacity="0.95" filter="url(#treeShadow3D)"/>
      <path class="treePathMask" d="M200,325 L285,380 L200,380 L115,380 Z" fill="url(#treeGradient)" stroke="#1a5f1a" stroke-width="3" opacity="0.85"/>
      <!-- Boules de Noël décoratives sur le sapin (plus nombreuses et mieux positionnées) -->
      <circle class="treeOrnament" cx="185" cy="140" r="7" fill="url(#ornamentRed)" opacity="0"/>
      <circle class="treeOrnament" cx="215" cy="160" r="6" fill="url(#ornamentGold)" opacity="0"/>
      <circle class="treeOrnament" cx="175" cy="200" r="7" fill="url(#ornamentBlue)" opacity="0"/>
      <circle class="treeOrnament" cx="225" cy="220" r="6" fill="url(#ornamentRed)" opacity="0"/>
      <circle class="treeOrnament" cx="190" cy="260" r="7" fill="url(#ornamentGold)" opacity="0"/>
      <circle class="treeOrnament" cx="210" cy="290" r="6" fill="url(#ornamentBlue)" opacity="0"/>
      <circle class="treeOrnament" cx="180" cy="330" r="7" fill="url(#ornamentRed)" opacity="0"/>
      <circle class="treeOrnament" cx="220" cy="350" r="6" fill="url(#ornamentGold)" opacity="0"/>
      <circle class="treeOrnament" cx="200" cy="180" r="5" fill="url(#ornamentBlue)" opacity="0"/>
      <circle class="treeOrnament" cx="195" cy="240" r="6" fill="url(#ornamentRed)" opacity="0"/>
      <!-- Reflets réalistes sur les boules -->
      <circle class="ornamentReflect" cx="187" cy="142" r="2.5" fill="#fff" opacity="0.8"/>
      <circle class="ornamentReflect" cx="217" cy="162" r="2" fill="#fff" opacity="0.8"/>
      <circle class="ornamentReflect" cx="177" cy="202" r="2.5" fill="#fff" opacity="0.8"/>
      <circle class="ornamentReflect" cx="227" cy="222" r="2" fill="#fff" opacity="0.8"/>
      <circle class="ornamentReflect" cx="192" cy="262" r="2.5" fill="#fff" opacity="0.8"/>
      <circle class="ornamentReflect" cx="212" cy="292" r="2" fill="#fff" opacity="0.8"/>
      <circle class="ornamentReflect" cx="182" cy="332" r="2.5" fill="#fff" opacity="0.8"/>
      <circle class="ornamentReflect" cx="222" cy="352" r="2" fill="#fff" opacity="0.8"/>
      <circle class="ornamentReflect" cx="202" cy="182" r="1.5" fill="#fff" opacity="0.8"/>
      <circle class="ornamentReflect" cx="197" cy="242" r="2" fill="#fff" opacity="0.8"/>
      <!-- Étoile au sommet améliorée -->
      <g id="star" transform="translate(200,50)">
        <path d="M0,-18 L5,-5 L18,-5 L7,3 L11,16 L0,9 L-11,16 L-7,3 L-18,-5 L-5,-5 Z" fill="#ffd700" stroke="#ffed4e" stroke-width="1.5" filter="url(#glow)"/>
        <path d="M0,-12 L3,-3 L12,-3 L5,2 L7,10 L0,6 L-7,10 L-5,2 L-12,-3 L-3,-3 Z" fill="#fffacd" opacity="0.8"/>
      </g>
      <!-- Particules de base (seront clonées) -->
      <circle id="circ" cx="200" cy="200" r="4" fill="#c41e3a" opacity="0.8"/>
      <path id="cross" d="M200,250 L200,260 M195,255 L205,255" stroke="#ffd700" stroke-width="2" opacity="0.8"/>
      <path id="heart" d="M200,300 C200,290 190,285 190,295 C190,285 180,290 180,300 C180,310 190,315 200,320 C210,315 220,310 220,300 C220,290 210,285 210,295 C210,285 200,290 200,300 Z" fill="#ff6b6b" opacity="0.8"/>
      <!-- Scintillement amélioré -->
      <circle class="sparkle" cx="200" cy="50" r="5" fill="#ffffff" opacity="0.9" filter="url(#glow)">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite"/>
        <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite"/>
      </circle>
      <!-- Message (au-dessus du tronc) -->
      <text id="endMessage" x="200" y="395" font-family="mountains_of_christmasregular" font-size="32" fill="#FFFFFF" opacity="0" text-anchor="middle" filter="url(#glow)">Joyeux Noël !</text>
    `;

    // Créer les particules
    const svgNS = 'http://www.w3.org/2000/svg';
    const colors = ['#E8F6F8', '#ACE8F8', '#F6FBFE', '#A2CBDC', '#B74551', '#5DBA72', '#910B28', '#446D39'];
    const shapes = ['#star', '#circ', '#cross', '#heart'];
    
    for (let i = 0; i < 10; i++) {
      const originalShape = svg.querySelector(shapes[i % shapes.length]);
      if (originalShape) {
        const particle = originalShape.cloneNode(true);
        particle.setAttribute('class', 'particle');
        particle.setAttribute('fill', colors[i % colors.length]);
        particle.setAttribute('opacity', '0');
        particle.setAttribute('transform', 'translate(-100,-100) scale(0)');
        svg.appendChild(particle);
        particles.push({
          element: particle,
          x: 200,
          y: 50,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          scale: Math.random() * 0.5 + 0.5,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 5,
          opacity: 0,
          life: 0,
          maxLife: Math.random() * 3 + 2
        });
      }
    }

    // Animation des éléments
    const sparkle = svg.querySelector('.sparkle');
    const star = svg.querySelector('#star');
    const endMessage = svg.querySelector('#endMessage');
    const treePaths = svg.querySelectorAll('.treePathMask');
    const treePot = svg.querySelector('.treePotMask');
    const treeOrnaments = svg.querySelectorAll('.treeOrnament');
    const ornamentReflects = svg.querySelectorAll('.ornamentReflect');

    // Animation de construction progressive du sapin sur 5 secondes
    const totalDuration = 5000; // 5 secondes
    // Compter uniquement les branches principales (une sur deux car elles sont en double couche)
    const mainBranches = Math.ceil(treePaths.length / 2);
    const branchDuration = totalDuration / (mainBranches + 3); // +3 pour le pot, l'étoile et les boules

    // Initialiser toutes les branches comme invisibles avec effet 3D
    treePaths.forEach((path, index) => {
      path.style.opacity = '0';
      path.style.transform = 'translateZ(-50px) scale(0.5)';
      path.style.transformOrigin = 'center bottom';
      path.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
    });

    // Initialiser le pot
    if (treePot) {
      treePot.style.opacity = '0';
      treePot.style.transform = 'translateZ(-30px) scale(0.3) translateY(20px)';
      treePot.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    }

    // Initialiser l'étoile (utiliser l'attribut transform du SVG)
    if (star) {
      star.style.opacity = '0';
      star.setAttribute('transform', 'translate(200,50) scale(0)');
      // Pas de transition CSS sur transform pour SVG, on utilisera l'animation JavaScript
    }

    // Initialiser les boules de Noël
    treeOrnaments.forEach((ornament, index) => {
      ornament.style.opacity = '0';
      ornament.style.transform = 'translateZ(-20px) scale(0)';
      ornament.style.transition = `opacity 0.4s ease-out ${index * 0.1}s, transform 0.4s ease-out ${index * 0.1}s`;
    });

    ornamentReflects.forEach((reflect) => {
      reflect.style.opacity = '0';
    });

    // Animation progressive : Pot d'abord
    if (treePot) {
      setTimeout(() => {
        treePot.style.opacity = '1';
        treePot.style.transform = 'translateZ(0) scale(1) translateY(0)';
      }, 200);
    }

    // Puis les branches de bas en haut avec effet 3D
    // Les branches sont en double couche, on les anime par paires
    treePaths.forEach((path, index) => {
      const branchIndex = Math.floor(index / 2); // Grouper par paires
      setTimeout(() => {
        path.style.opacity = '1';
        path.style.transform = 'translateZ(0) scale(1)';
        // Ajouter un léger effet de profondeur 3D
        const depth = (index % 2 === 0) ? '0' : '5px'; // Couche avant/arrière
        path.style.transform = `translateZ(${depth}) scale(1)`;
      }, 400 + (branchIndex * branchDuration) + (index % 2) * 100);
    });

    // Ajouter les boules de Noël progressivement après chaque branche
    treeOrnaments.forEach((ornament, index) => {
      const branchIndex = Math.floor(index / 2); // 2 boules par branche environ
      setTimeout(() => {
        ornament.style.opacity = '1';
        ornament.style.transform = 'translateZ(15px) scale(1)';
        // Ajouter un léger balancement réaliste
        const swingInterval = setInterval(() => {
          if (!document.body.classList.contains('holiday-christmas')) {
            clearInterval(swingInterval);
            return;
          }
          const swing = Math.sin(Date.now() / 2000 + index) * 3;
          const depth = 15 + Math.sin(Date.now() / 1500 + index) * 3;
          ornament.style.transform = `translateZ(${depth}px) scale(1) rotate(${swing}deg)`;
        }, 50);
      }, 400 + (branchIndex * branchDuration) + 300 + (index % 2) * 200);
    });

    // Ajouter les reflets sur les boules
    ornamentReflects.forEach((reflect, index) => {
      setTimeout(() => {
        reflect.style.opacity = '0.6';
      }, 400 + (Math.floor(index / 2) * branchDuration) + 500);
    });

    // Enfin l'étoile au sommet
    if (star) {
      setTimeout(() => {
        star.style.opacity = '1';
        star.setAttribute('transform', 'translate(200,50) scale(1)');
      }, 400 + (mainBranches * branchDuration) + 200);
    }

    // Animation de l'étoile (après la construction)
    if (star) {
      setTimeout(() => {
        let starScale = 1;
        setInterval(() => {
          starScale = 0.9 + Math.sin(Date.now() / 500) * 0.1;
          star.setAttribute('transform', `translate(200,50) scale(${starScale})`);
        }, 50);
      }, 400 + (mainBranches * branchDuration) + 500);
    }

    // Animation du scintillement
    if (sparkle) {
      let sparkleAngle = 0;
      setInterval(() => {
        sparkleAngle += 3;
        const radius = 25;
        const x = 200 + Math.cos(sparkleAngle * Math.PI / 180) * radius;
        const y = 50 + Math.sin(sparkleAngle * Math.PI / 180) * radius;
        sparkle.setAttribute('cx', x);
        sparkle.setAttribute('cy', y);
      }, 50);
    }

    // Animation des particules
    function animateParticles() {
      particles.forEach((particle, index) => {
        if (particle.life < particle.maxLife) {
          particle.life += 0.016; // ~60fps
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.1; // Gravité
          particle.rotation += particle.rotationSpeed;
          particle.opacity = Math.min(1, particle.life / 0.5);
          
          if (particle.life > particle.maxLife * 0.7) {
            particle.opacity = 1 - (particle.life - particle.maxLife * 0.7) / (particle.maxLife * 0.3);
          }

          particle.element.setAttribute('transform', 
            `translate(${particle.x},${particle.y}) scale(${particle.scale * (1 - particle.life / particle.maxLife)}) rotate(${particle.rotation})`);
          particle.element.setAttribute('opacity', particle.opacity);

          // Réinitialiser si hors écran ou vie terminée
          if (particle.life >= particle.maxLife || particle.y > 500 || particle.x < -50 || particle.x > 450) {
            particle.x = 200;
            particle.y = 50;
            particle.vx = (Math.random() - 0.5) * 3;
            particle.vy = (Math.random() - 0.5) * 2;
            particle.life = 0;
            particle.scale = Math.random() * 0.5 + 0.5;
          }
        }
      });

      if (document.body.classList.contains('holiday-christmas')) {
        animationFrame = requestAnimationFrame(animateParticles);
      }
    }

    // Démarrer l'animation des particules après la construction complète (5 secondes)
    setTimeout(() => {
      animateParticles();
    }, 5000);

    // Afficher le message après la construction complète (5.5 secondes)
    setTimeout(() => {
      if (endMessage) {
        endMessage.style.transition = 'opacity 1.5s ease-out';
        endMessage.style.opacity = '1';
      }
    }, 5500);

    treeAnimationInitialized = true;
  }

  function removeChristmasTreeAnimation() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    particles = [];
    const container = document.getElementById('christmasTreeContainer');
    if (container) {
      container.remove();
    }
    treeAnimationInitialized = false;
  }

  // Observer les changements de classe sur le body
  const bodyObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        if (document.body.classList.contains('holiday-christmas')) {
          setTimeout(initChristmasTreeAnimation, 500);
        } else {
          removeChristmasTreeAnimation();
        }
      }
    });
  });

  if (document.body) {
    bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    
    if (document.body.classList.contains('holiday-christmas')) {
      setTimeout(initChristmasTreeAnimation, 1000);
    }
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      if (document.body.classList.contains('holiday-christmas')) {
        setTimeout(initChristmasTreeAnimation, 1000);
      }
    });
  }

  // Exposer les fonctions
  window.initChristmasTreeAnimation = initChristmasTreeAnimation;
  window.removeChristmasTreeAnimation = removeChristmasTreeAnimation;

})();
