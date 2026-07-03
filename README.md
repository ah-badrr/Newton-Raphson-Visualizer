<div align="center">

# 🧮 Newton-Raphson Visualizer

### Interactive Web-Based Root-Finding Algorithm Explorer

**Visualize, analyze, and understand** the Newton-Raphson method through real-time geometric interpretation and convergence diagnostics.

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Math.js](https://img.shields.io/badge/Math.js-008080?style=for-the-badge&logo=javascript&logoColor=white)](https://mathjs.org/)
[![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chart.js&logoColor=white)](https://www.chartjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![No Build Step](https://img.shields.io/badge/Build-None-brightgreen?style=for-the-badge)](#)

[🚀 Live Demo](#-live-demo) • [📸 Preview](#-preview) • [📖 Overview](#-overview) • [⚡ Features](#-key-features) • [🛠 Tech Stack](#-tech-stack) • [🏃 Run Locally](#-how-to-run)

</div>

---

## 🚀 Live Demo

> 🔗 **https://ah-badrr.github.io/Newton-Raphson-Visualizer//**

*Deployed via GitHub Pages — zero backend, instant load.*

---

## 📸 Preview

<div align="center">

![Newton-Raphson Visualizer Demo](./docs/demo-preview.gif)

<!-- Replace with your actual screenshot/GIF. Recommended size: 1280x720 -->
<!-- You can use tools like [ScreenToGif](https://www.screentogif.com/) or [LICEcap](https://www.cockos.com/licecap/) to record -->

<details>
<summary>📷 More Screenshots</summary>

| Input Panel | Geometric Visualization |
|:---:|:---:|
| ![Input](./docs/screenshot-input.png) | ![Chart](./docs/screenshot-chart.png) |

| Iteration Table | Convergence Analysis |
|:---:|:---:|
| ![Table](./docs/screenshot-table.png) | ![Analysis](./docs/screenshot-analysis.png) |

</details>

</div>

---

## 📖 Overview

### What is the Newton-Raphson Method?

The **Newton-Raphson method** is one of the most powerful root-finding algorithms in numerical analysis. Given a differentiable function $f(x)$, it iteratively approximates a root using the formula:

$$
x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}
$$

Geometrically, each iteration constructs a **tangent line** at the current point $(x_n, f(x_n))$ and uses its x-intercept as the next approximation. For simple roots, the method exhibits **quadratic convergence** — the number of correct digits roughly *doubles* with each iteration.

### Why This Visualizer?

Most textbook explanations of Newton-Raphson are purely algebraic. This project bridges the gap between **theory and intuition** by providing:

- 🎯 A **geometric interpretation** of each iteration through live tangent-line animation
- 🧪 An **interactive sandbox** to experiment with different functions and initial guesses
- 📊 **Quantitative convergence analysis** that reveals *why* the method succeeds or fails
- 🎓 An **educational lens** into numerical stability, basin of attraction, and failure modes

Whether you're a student learning numerical methods or an engineer refreshing your knowledge, this tool makes the invisible mathematics *visible*.

---

## ⚡ Key Features

### 🎨 Interactive Visualization
- **Real-time 2D plot** of $f(x)$ with dynamically scaled axes
- **Tangent line construction** drawn for each iteration — watch the geometric interpretation unfold
- **Color-coded markers**: curve (indigo), iteration points (orange), final root (red)
- **Hover tooltips** with precise coordinates on every data point

### 🧠 Intelligent Computation
- **Automatic symbolic differentiation** via `math.js` — no manual derivative entry required
- **Second-derivative analysis** for curvature diagnostics
- **Smart convergence detection** with quadratic ratio estimation $\frac{|e_{n+1}|}{|e_n|^2}$
- **Robust error handling** for division-by-zero, NaN propagation, and invalid expressions

### 📋 Detailed Output
- **Step-by-step iteration table** with $x_n$, $f(x_n)$, $f'(x_n)$, $x_{n+1}$, and absolute error
- **Scientific notation** for extremely small/large values
- **Color-highlighted convergence** when tolerance is met

### 🎓 Educational Analysis Panel
- **Prediction summary** with final root and residual verification
- **Convergence rate diagnosis** (quadratic vs. linear vs. divergent)
- **Equation characteristics** — detects multiple roots via $|f'(x^*)| \approx 0$
- **Failure mode warnings** with actionable recommendations

### 🎯 UX & Design
- **Fully responsive** layout — works seamlessly on desktop, tablet, and mobile
- **Dark theme** with Slate + Indigo palette for reduced eye strain
- **Smooth animations** and scroll-into-view transitions
- **Zero build step** — pure static HTML, opens instantly in any browser

---

## 🛠 Tech Stack

| Technology | Role | Why I Chose It |
|---|---|---|
| **HTML5** | Semantic structure | Native, accessible, zero dependencies |
| **Tailwind CSS** (CDN) | Utility-first styling | Rapid prototyping with consistent Slate/Indigo design system |
| **Vanilla JavaScript** | Core logic | No framework overhead — maximum performance and transparency |
| **[Math.js](https://mathjs.org/)** | Symbolic math engine | Parses expressions & computes derivatives automatically |
| **[Chart.js](https://www.chartjs.org/)** | Data visualization | Lightweight, interactive, and highly customizable |
| **GitHub Pages** | Hosting | Free, fast, and integrated with the repository |

> 💡 **Architecture decision:** I deliberately chose a **zero-build, zero-framework** stack. For a single-page educational tool, this minimizes attack surface, eliminates dependency rot, and ensures the project remains runnable years from now.

---

## 🏃 How to Run

Since this is a **pure static project**, you have three options:

### Option 1: Direct Open (Simplest)
```bash
# Just double-click the file, or:
open index.html            # macOS
xdg-open index.html        # Linux
start index.html           # Windows
