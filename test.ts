import { BusinessCard } from "./reCAPTHCA.js";

export function main(canvas: HTMLCanvasElement, scrambleSteps: number, showHints: boolean, debug: boolean) {

    const horTiles = 5;
    const verTiles = 3;
    const tileSize = 256;
    const borderSize = 64;

    const holeHor = horTiles - 1;
    const holeVer = verTiles - 1;

    const innerWidth = horTiles * tileSize;
    const innerHeight = verTiles * tileSize;

    const width = innerWidth + 2 * borderSize;
    const height = innerHeight + 2 * borderSize;
    
    const painter = (ctx: CanvasRenderingContext2D, background: boolean) => {
        
        const mainGradient = ctx.createLinearGradient(borderSize - 2 * tileSize, borderSize + 0 * tileSize, borderSize + 7 * tileSize, borderSize + 3 * tileSize);
        mainGradient.addColorStop(0, "rgb(40, 40, 40)");
        mainGradient.addColorStop(1, "rgb(180, 180, 180)");
        ctx.fillStyle = mainGradient;
        ctx.beginPath();
        ctx.rect(0, 0, width, height);
        ctx.fill();
        
        const leftGradient = ctx.createLinearGradient(borderSize - 2 * tileSize, borderSize + 3 * tileSize, borderSize + 3 * tileSize, borderSize - tileSize);
        leftGradient.addColorStop(0, "rgb(80, 80, 80)");
        leftGradient.addColorStop(1, "rgb(140, 140, 140)");
        ctx.fillStyle = leftGradient; //background ? "rgb(180, 180, 180)" : "rgb(200, 80, 80)";
        ctx.beginPath();
        ctx.arc(borderSize + .3 * tileSize, borderSize + 1.3 * tileSize, 2.4 * tileSize, 0, 2 * Math.PI, false);
        ctx.fill();

        if (background) {
            ctx.fillStyle = "rgb(80, 80, 80)";
            ctx.beginPath();
            ctx.rect(borderSize, borderSize, innerWidth, innerHeight);
            ctx.fill();
            return;
        }

        ctx.fillStyle = "rgb(220, 220, 220)";
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.font = `${.4 * tileSize}px serif`;
        ctx.fillText("Name Lastname", borderSize + .4 * tileSize, borderSize + .5 * tileSize);
        ctx.font = `${.3 * tileSize}px serif`;
        ctx.fillText("Jobtitle/Company etc.", borderSize + .4 * tileSize, borderSize + 1.2 * tileSize);

        ctx.fillText("Phone: +1234567890", borderSize + .4 * tileSize, borderSize + 2.0 * tileSize);
        ctx.fillText("Email: name@lastname.com", borderSize + .4 * tileSize, borderSize + 2.6 * tileSize);
        
        if (debug) {
            for (let v = 0; v < verTiles; v++) {
                for (let h = 0; h < horTiles; h++) {
                    ctx.fillStyle = (h === holeHor && v === holeVer) ? `rgba(80, 80, 80, .1)` : `rgba(80, 80, 80, .5)`;
                    ctx.beginPath();
                    ctx.arc(borderSize + (h + .5) * tileSize, borderSize + (v + .5) * tileSize, .3 * tileSize, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
            ctx.font = `${tileSize/2.5}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            let i = 0;
            for (let v = 0; v < verTiles; v++) {
                for (let h = 0; h < horTiles; h++) {
                    ctx.fillStyle = (h === holeHor && v === holeVer) ? `rgba(0, 0, 0, .2)` : `black`;
                    ctx.fillText(`${i}`, borderSize + (h + .5) * tileSize, borderSize + (v + .5) * tileSize);
                    i++;
                }
            }
        }
    }

    const bcc = new BusinessCard(horTiles, verTiles, tileSize, borderSize, painter, [holeHor, holeVer], scrambleSteps, "./home.html");

    bcc.showHints = showHints;

    canvas.width = width;
    canvas.height = height;

    canvas.style.width = `${width / 4}px`;
    canvas.style.height = `${height / 4}px`;

    canvas.onclick = (ev: MouseEvent) => {
        var rect = canvas.getBoundingClientRect();
        var x = ((ev.clientX - rect.left) / rect.width) * width;
        var y = ((ev.clientY - rect.top) / rect.height) * height;
        bcc.click(x, y);
    };

    const canvasCtx = canvas.getContext("2d")!;

    const animationFrame = (_millis: number) => {
        if (bcc.currentState.maximalSolveDistance === 0) {
            bcc.done = true;
        }
        bcc.draw(canvasCtx);
        window.requestAnimationFrame(animationFrame);
    };

    window.requestAnimationFrame(animationFrame);
}

