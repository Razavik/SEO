// Минимальный общий скрипт для статического сайта
// Подсветка активного пункта меню и эффект шапки при скролле
(function () {
	function setActiveNav() {
		var path = location.pathname.split("/").pop() || "index.html";
		document.querySelectorAll(".nav__link").forEach(function (a) {
			var href = a.getAttribute("href");
			if (href === path) {
				a.classList.add("active");
			} else {
				a.classList.remove("active");
			}
		});
	}
	function headerOnScroll() {
		var header = document.querySelector(".site-header");
		if (!header) return;
		var last = window.scrollY > 50;
		header.classList.toggle("scrolled", last);
	}

	// ===== Звёздный фон (canvas) =====
	function initStarfield() {
		var hero = document.querySelector(".hero");
		if (!hero) return function () {};
		var canvas = document.createElement("canvas");
		canvas.className = "starfield-canvas starfield-canvas--hero";
		canvas.setAttribute("aria-hidden", "true");
		var ctx = canvas.getContext("2d");
		var dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
		var stars = [];
		var rafId = 0;
		var ro;

		function size() {
			var rect = hero.getBoundingClientRect();
			var w = Math.max(1, Math.floor(rect.width));
			var h = Math.max(1, Math.floor(rect.height));
			canvas.width = Math.floor(w * dpr);
			canvas.height = Math.floor(h * dpr);
			canvas.style.width = w + "px";
			canvas.style.height = h + "px";
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			spawn();
		}

		function spawn() {
			var area = (canvas.width * canvas.height) / (dpr * dpr);
			var density = 0.00012; // плотность звёзд на пиксель
			var count = Math.min(450, Math.max(120, Math.floor(area * density)));
			stars = new Array(count).fill(0).map(function () {
				var x = Math.random() * (canvas.width / dpr);
				var y = Math.random() * (canvas.height / dpr);
				var r = Math.random() * 1.6 + 0.3; // радиус 0.3–1.9
				var tw = Math.random() * 2 + 1.2; // скорость мерцания
				var p = Math.random() * Math.PI * 2; // фаза
				var glow = 0.6 + Math.random() * 0.6; // сила свечения
				return { x: x, y: y, r: r, tw: tw, p: p, g: glow };
			});
		}

		function draw(t) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			for (var i = 0; i < stars.length; i++) {
				var s = stars[i];
				var a = 0.55 + 0.45 * Math.sin((t / 1000) * s.tw + s.p); // альфа мерцания
				ctx.beginPath();
				ctx.fillStyle = "rgba(255,255,255," + a + ")";
				ctx.shadowColor = "rgba(126,161,255," + 0.35 * s.g + ")";
				ctx.shadowBlur = 6 * s.g;
				ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
				ctx.fill();
			}
			rafId = requestAnimationFrame(draw);
		}

		function start() {
			// вставляем канву в hero, под контентом, но над hero__bg
			var anchor = hero.querySelector(".hero__container") || hero.firstChild;
			hero.insertBefore(canvas, anchor);
			size();
			draw(0);
			window.addEventListener("resize", size);
			// наблюдаем за изменением размера hero
			if ("ResizeObserver" in window) {
				ro = new ResizeObserver(size);
				ro.observe(hero);
			}
		}

		start();

		return function destroy() {
			cancelAnimationFrame(rafId);
			window.removeEventListener("resize", size);
			if (ro) ro.disconnect();
			canvas.remove();
		};
	}
	document.addEventListener("DOMContentLoaded", function () {
		setActiveNav();
		headerOnScroll();
		window.addEventListener("scroll", headerOnScroll, { passive: true });
		initStarfield();

		// Кнопка "наверх": появляется после прокрутки и скроллит плавно
		var toTop = document.querySelector(".to-top");
		if (toTop) {
			var threshold = 300;
			function toggleToTop() {
				var show = window.scrollY > threshold;
				toTop.classList.toggle("to-top--visible", show);
			}
			toggleToTop();
			window.addEventListener("scroll", toggleToTop, { passive: true });
			toTop.addEventListener("click", function (e) {
				e.preventDefault();
				window.scrollTo({ top: 0, behavior: "smooth" });
			});
		}

		// ===== Параллакс и затухание HERO при скролле =====
		(function initHeroParallax() {
			var hero = document.querySelector(".hero");
			if (!hero) return;
			var bg = hero.querySelector(".hero__bg");
			var stars = hero.querySelector(".starfield-canvas--hero");
			var title = hero.querySelector(".hero__title");
			var subtitle = hero.querySelector(".hero__subtitle");
			var ticking = false;

			function clamp(v, min, max) {
				return v < min ? min : v > max ? max : v;
			}
			function onScroll() {
				if (ticking) return;
				ticking = true;
				requestAnimationFrame(function () {
					var vh = Math.max(1, window.innerHeight);
					var progress = clamp(window.scrollY / (vh * 0.9), 0, 1);
					var bgY = progress * 40; // px
					var starY = progress * 20; // px
					var textY = progress * 24; // px
					var titleScale = 1 - progress * 0.15; // от 1 до ~0.85
					var subScale = 1 - progress * 0.08; // от 1 до ~0.92
					var fade = 1 - progress * 0.95;

					if (bg)
						bg.style.transform =
							"translate3d(0," + bgY + "px,0) scale(" + (1 + progress * 0.02) + ")";
					if (stars) stars.style.transform = "translate3d(0," + starY + "px,0)";
					if (title) {
						title.style.opacity = String(fade);
						title.style.transform =
							"translate3d(0," + textY + "px,0) scale(" + titleScale + ")";
						title.style.transformOrigin = "center top";
					}
					if (subtitle) {
						subtitle.style.opacity = String(fade);
						subtitle.style.transform =
							"translate3d(0," + textY * 0.8 + "px,0) scale(" + subScale + ")";
						subtitle.style.transformOrigin = "center top";
					}

					ticking = false;
				});
			}

			onScroll();
			window.addEventListener("scroll", onScroll, { passive: true });
			window.addEventListener("resize", onScroll);
		})();

		// ===== Бургер-меню =====
		(function initBurger() {
			var burger = document.getElementById("burger");
			var nav = document.getElementById("nav");

			if (!burger || !nav) return;

			burger.addEventListener("click", function () {
				burger.classList.toggle("active");
				nav.classList.toggle("active");
			});

			// Закрытие меню при клике на ссылку
			var navLinks = nav.querySelectorAll(".nav__link");
			navLinks.forEach(function (link) {
				link.addEventListener("click", function () {
					burger.classList.remove("active");
					nav.classList.remove("active");
				});
			});

			// Закрытие меню при клике вне его
			document.addEventListener("click", function (e) {
				if (!nav.contains(e.target) && !burger.contains(e.target)) {
					burger.classList.remove("active");
					nav.classList.remove("active");
				}
			});
		})();

		// ===== FAQ: плавное раскрытие =====
		(function initFAQ() {
			var faqItems = document.querySelectorAll(".faq__item");

			faqItems.forEach(function (item) {
				var summary = item.querySelector("summary");
				var content = Array.from(item.children).filter(function (child) {
					return child !== summary;
				});

				// Оборачиваем контент в div для анимации
				if (content.length > 0) {
					var wrapper = document.createElement("div");
					wrapper.className = "faq__content";
					var innerDiv = document.createElement("div");
					content.forEach(function (el) {
						innerDiv.appendChild(el);
					});
					wrapper.appendChild(innerDiv);
					item.appendChild(wrapper);
				}

				var contentWrapper = item.querySelector(".faq__content");

				// Отключаем стандартное поведение details
				item.addEventListener("toggle", function (e) {
					e.preventDefault();
				});

				// Функция для анимированного открытия/закрытия
				function toggleFAQ(e) {
					e.preventDefault();
					e.stopPropagation();

					var isOpen = item.hasAttribute("open");

					if (isOpen) {
						// Закрываем
						var height = contentWrapper.scrollHeight;
						contentWrapper.style.height = height + "px";

						requestAnimationFrame(function () {
							contentWrapper.style.height = "0px";
						});

						setTimeout(function () {
							item.removeAttribute("open");
							contentWrapper.style.height = "";
						}, 300);
					} else {
						// Открываем
						item.setAttribute("open", "");
						var height = contentWrapper.scrollHeight;
						contentWrapper.style.height = "0px";

						requestAnimationFrame(function () {
							contentWrapper.style.height = height + "px";
						});

						setTimeout(function () {
							contentWrapper.style.height = "";
						}, 300);
					}
				}

				// Клик по summary
				summary.addEventListener("click", toggleFAQ);

				// Клик по всей плашке (кроме контента внутри)
				item.addEventListener("click", function (e) {
					if (e.target === item || e.target === summary) {
						toggleFAQ(e);
					}
				});
			});
		})();

		// ===== Генерация звёзд в галактике =====
		(function initGalaxy() {
			var galaxyViz = document.getElementById("galaxyViz");
			if (!galaxyViz) return;

			var arms = ["arm1", "arm2", "arm3"];
			var armOffsets = [0, 120, 240]; // Смещение рукавов на 120 градусов

			arms.forEach(function (armId, armIndex) {
				var arm = document.getElementById(armId);
				if (!arm) return;

				// Генерируем звёзды вдоль спирального рукава
				for (var i = 0; i < 40; i++) {
					var star = document.createElement("div");
					star.className = "star-cluster";

					// Логарифмическая спираль
					var t = i / 40; // 0 to 1
					var angle = armOffsets[armIndex] + t * 360 * 1.5; // 1.5 оборота
					var radius = 30 + t * 180; // От центра к краю

					// Добавляем случайное отклонение для реалистичности
					var randomOffset = (Math.random() - 0.5) * 20;
					var finalRadius = radius + randomOffset;

					var angleRad = (angle * Math.PI) / 180;
					var offsetX = Math.cos(angleRad) * finalRadius;
					var offsetY = Math.sin(angleRad) * finalRadius;

					star.style.left = "50%";
					star.style.top = "50%";
					star.style.transform = "translate(" + offsetX + "px, " + offsetY + "px)";
					star.style.animationDelay = Math.random() * 3 + "s";
					star.style.animationDuration = 2 + Math.random() * 2 + "s";

					// Варьируем размер звёзд
					var size = 2 + Math.random() * 3;
					star.style.width = size + "px";
					star.style.height = size + "px";

					// Варьируем яркость
					star.style.opacity = 0.6 + Math.random() * 0.4;

					arm.appendChild(star);
				}
			});
		})();
	});
})();
