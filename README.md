# Pear Up!

[<img src="./assets/pearup.png" alt="logo" style="width: 400px; height: 400px;">](Logo)

A simple P2P Omegle clone relying on "Pears by Holepunch" as its runtime, development, and deployment tooling. Peer seeking and chat is handled by Hyperswarm and video streaming is handled by WebRTC. The frontend is built with raw HTML, CSS, and JS with the use of TailwindCSS for styling.

## Stack
- [Pear by Holepunch](https://docs.pears.com/)
- [Hyperswarm](https://docs.pears.com/building-blocks/hyperswarm)
- [WebRTC](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [TailwindCSS](https://tailwindcss.com/)


## Setup & Usage

1. Install the Pear runtime here: [https://docs.pears.com/guides/getting-started](https://docs.pears.com/guides/getting-started)

2. Run ```pear run pear://hwye9kk9sotu1wmkpskry7kaqny5mag3zjtbw9jz4sasuenun1uo```

#### Alternatively, you can clone the repo and use pear run to run it locally.

## NOTE:
The TURN server used in this project has a bandwith limit so the video stremaing might not always work.