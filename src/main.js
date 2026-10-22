import "./style.css";

const canvas = document.querySelector("#heart");
const context = canvas.getContext("2d");
const replayButton = document.querySelector("#replay");
const phrase = "I love you";
const background = "#060208";
const duration = 10000;
const animationDuration = (42 * 1000) / 60;
const lift = 34;
const flashColor = [1, 0.78, 0.78];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let width = 0;
let height = 0;
let scale = 1;
let words = [];
let startedAt = 0;
let frameId = 0;
let shimmerTimer = 0;
let shimmerEvents = [];
let nextShimmerAt = duration + animationDuration;

function mix(first, second, amount) {
  return first.map((value, index) => value + (second[index] - value) * amount);
}

function hexColor(color) {
  return `#${color
    .map((channel) =>
      Math.round(Math.max(0, Math.min(1, channel)) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function heartPoint(angle) {
  return {
    x: 16 * Math.sin(angle) ** 3,
    y:
      13 * Math.cos(angle) -
      5 * Math.cos(2 * angle) -
      2 * Math.cos(3 * angle) -
      Math.cos(4 * angle),
  };
}

function spansAt(points, y) {
  const intersections = [];

  for (let index = 0; index < points.length; index += 1) {
    const first = points[index];
    const second = points[(index + 1) % points.length];

    if ((first.y <= y && second.y > y) || (second.y <= y && first.y > y)) {
      intersections.push(
        first.x + ((y - first.y) * (second.x - first.x)) / (second.y - first.y),
      );
    }
  }

  intersections.sort((left, right) => left - right);
  const spans = [];
  for (let index = 0; index + 1 < intersections.length; index += 2) {
    spans.push([intersections[index], intersections[index + 1]]);
  }
  return spans;
}

function createWords() {
  const placed = [];
  const sizes = [9, 10, 11, 12];
  const fontSize = Math.max(9, Math.min(12, width / 46));
  const rowHeight = 20;
  const heartWidth = Math.min(width * 0.88, height * 0.66);
  const unit = heartWidth / 32;
  const heart = Array.from({ length: 720 }, (_, index) =>
    heartPoint((2 * Math.PI * index) / 720),
  );
  const top = Math.max(...heart.map((point) => point.y));
  const bottom = Math.min(...heart.map((point) => point.y));
  const heartCenter = (top + bottom) / 2;
  const originX = width / 2;
  const originY = height * 0.43;

  context.font = `700 ${fontSize}px Arial, sans-serif`;
  const rowStep = rowHeight / unit;

  for (let y = top - rowStep / 2; y > bottom + rowStep / 2; y -= rowStep) {
    const upperSpans = spansAt(heart, y + rowStep / 2);
    const lowerSpans = spansAt(heart, y - rowStep / 2);

    for (const [upperLeft, upperRight] of upperSpans) {
      for (const [lowerLeft, lowerRight] of lowerSpans) {
        const lo = Math.max(upperLeft, lowerLeft) * unit + originX + 4;
        const hi = Math.min(upperRight, lowerRight) * unit + originX - 4;
        const left = lo + Math.random() * 8;
        const right = hi;
        let current = left;
        const line = [];

        while (true) {
          let fit;
          for (let attempt = 0; attempt < 10; attempt += 1) {
            const size = sizes[Math.floor(Math.random() * sizes.length)];
            context.font = `700 ${size}px Arial, sans-serif`;
            const textWidth = context.measureText(phrase).width;
            if (current + textWidth <= right) {
              fit = { size, width: textWidth };
              break;
            }
          }
          if (!fit) break;

          line.push({
            x: current + fit.width / 2,
            y: originY - y * unit,
            size: fit.size,
            width: fit.width,
          });
          current += fit.width + 7;
        }

        if (line.length === 0) continue;
        if (line.length > 1) {
          const unused = right - (line[line.length - 1].x + line[line.length - 1].width / 2);
          line.forEach((word, index) => {
            word.x += (unused * index) / (line.length - 1);
          });
        } else {
          line[0].x = (lo + hi) / 2;
        }

        line.forEach((word, index) => {
          word.edge = index === 0 || index === line.length - 1;
          const dx = word.x - originX;
          const dy = originY - word.y - heartCenter * unit;
          word.rad = Math.min(Math.hypot(dx / (16 * unit), dy / (14.5 * unit)), 1);
          placed.push(word);
        });
      }
    }
  }

  const wine = [0.58, 0, 0.09];
  const crimson = [0.9, 0.05, 0.14];
  const blood = [0.98, 0.1, 0.16];
  for (const word of placed) {
    let color = mix(wine, crimson, 0.25 + 0.75 * word.rad);
    color = mix(color, blood, Math.random() * 0.35 + (word.edge ? 0.3 : 0));
    word.color = color.map((channel) => Math.min(channel, 1));
    word.dx = (Math.random() - 0.5) * 20;
  }

  const edges = placed.filter((word) => word.edge);
  const inner = placed.filter((word) => !word.edge);
  edges.sort((first, second) => {
    const firstAngle = Math.atan2(first.x - originX, originY - first.y - heartCenter * unit);
    const secondAngle = Math.atan2(second.x - originX, originY - second.y - heartCenter * unit);
    return (
      (firstAngle + 2 * Math.PI) % (2 * Math.PI) -
      ((secondAngle + 2 * Math.PI) % (2 * Math.PI))
    );
  });
  inner.sort((first, second) => second.rad - first.rad + (Math.random() - 0.5) * 0.08);

  return [...edges, ...inner].map((word, index, ordered) => ({
    ...word,
    delay: (index * duration) / ordered.length,
  }));
}

function resize() {
  const bounds = canvas.getBoundingClientRect();
  width = bounds.width;
  height = bounds.height;
  scale = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  context.setTransform(scale, 0, 0, scale, 0, 0);
  words = createWords();
  restart();
}

function restart() {
  cancelAnimationFrame(frameId);
  window.clearTimeout(shimmerTimer);
  startedAt = performance.now();
  shimmerEvents = [];
  nextShimmerAt = duration + animationDuration;
  frameId = requestAnimationFrame(animate);
}

function draw(elapsed) {
  context.clearRect(0, 0, width, height);
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  while (elapsed >= nextShimmerAt && words.length > 0) {
    shimmerEvents.push({
      word: words[Math.floor(Math.random() * words.length)],
      startedAt: nextShimmerAt,
    });
    nextShimmerAt += 140;
  }
  shimmerEvents = shimmerEvents.filter((event) => elapsed - event.startedAt < 260);

  for (const word of words) {
    const progress = Math.max(0, Math.min(1, (elapsed - word.delay) / animationDuration));
    if (progress === 0) continue;

    const ease = 1 - (1 - progress) ** 3;
    const moving = progress < 1 && !reducedMotion.matches;
    const x = word.x + (moving ? word.dx * (1 - ease) : 0);
    const y = word.y - (moving ? lift * (1 - ease) : 0);

    context.globalAlpha = 1;
    context.font = `700 ${word.size}px Arial, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillStyle = hexColor(
      mix([6 / 255, 2 / 255, 8 / 255], word.color.map((channel) => channel * 0.3), ease),
    );
    context.fillText(phrase, x + 2, y + 3);

    context.fillStyle = hexColor(
      mix([6 / 255, 2 / 255, 8 / 255], word.color.map((channel) => channel * 0.2), ease ** 2),
    );
    context.font = `700 ${word.size + 1}px Arial, sans-serif`;
    context.fillText(phrase, x, y);

    const flash = moving
      ? 0.75 * Math.sin(Math.PI * Math.max(0, Math.min(1, (progress - 0.55) / 0.45)))
      : 0;
    const color = mix(
      mix([6 / 255, 2 / 255, 8 / 255], word.color, ease ** 1.5),
      flashColor,
      flash,
    );
    const shimmer = shimmerEvents.some((event) => event.word === word);
    context.fillStyle = hexColor(shimmer ? mix(word.color, flashColor, 0.6) : color);
    context.font = `700 ${word.size}px Arial, sans-serif`;
    context.fillText(phrase, x, y);
  }

  context.globalAlpha = 1;
  context.shadowBlur = 0;
}

function animate(now) {
  const elapsed = now - startedAt;
  draw(elapsed);
  if (elapsed < duration + animationDuration) {
    frameId = requestAnimationFrame(animate);
  } else {
    shimmerTimer = window.setTimeout(shimmer, 140);
  }
}

function shimmer() {
  draw(performance.now() - startedAt);
  shimmerTimer = window.setTimeout(shimmer, 140);
}

replayButton.addEventListener("click", restart);
window.addEventListener("resize", resize);
reducedMotion.addEventListener("change", restart);
resize();
