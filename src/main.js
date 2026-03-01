import { dialogueData, scaleFactor } from "./constants";
import { k } from "./kaboomCtx";
import { displayDialogue, setCamScale } from "./utils";

// ================= AUDIO UNLOCK (ITCH FIX) =================
window.addEventListener("click", async () => {
  if (k.audioCtx && k.audioCtx.state !== "running") {
    await k.audioCtx.resume();
  }
});

window.addEventListener("keydown", async () => {
  if (k.audioCtx && k.audioCtx.state !== "running") {
    await k.audioCtx.resume();
  }
});

// ---------------- SPRITES ----------------
k.loadSprite("spritesheet", "./spritesheet.png", {
  sliceX: 39,
  sliceY: 31,
  anims: {
    "idle-down": 936,
    "walk-down": { from: 936, to: 939, loop: true, speed: 8 },
    "idle-side": 975,
    "walk-side": { from: 975, to: 978, loop: true, speed: 8 },
    "idle-up": 1014,
    "walk-up": { from: 1014, to: 1017, loop: true, speed: 8 },
  },
});

k.loadSprite("map", "./map.png");

// ---------------- SOUNDS ----------------
k.loadSound("introMusic", "08 - Shop.mp3");
k.loadSound("gameMusic", "03 - Definitely Our Town.mp3");

k.setBackground(k.Color.fromHex("#000000"));

// =====================================================
// INTRO SCENE
// =====================================================
k.scene("intro", () => {

  k.add([
    k.text("PRAKRIT MOHANTY", { size: 36, font: "monogram" }),
    k.pos(k.width() / 2, k.height() / 2 - 60),
    k.anchor("center"),
  ]);

  k.add([
    k.text("Interactive Developer Portfolio", {
      size: 18,
      font: "monogram",
    }),
    k.pos(k.width() / 2, k.height() / 2 - 20),
    k.anchor("center"),
  ]);

  const startText = k.add([
    k.text("Press ENTER to Start", {
      size: 20,
      font: "monogram",
    }),
    k.pos(k.width() / 2, k.height() / 2 + 40),
    k.anchor("center"),
  ]);

  k.loop(0.6, () => {
    startText.hidden = !startText.hidden;
  });

  k.onKeyPress("enter", async () => {

    if (k.audioCtx && k.audioCtx.state !== "running") {
      await k.audioCtx.resume();
    }

    const introTrack = k.play("introMusic", {
      loop: true,
      volume: 0.5,
    });

    k.wait(0.25, () => {
      introTrack.stop();
      k.go("story");
    });
  });
});

k.scene("story", () => {

  let fullText = 
`Initializing portfolio...

Hi, I'm Prakrit — Software Engineer.

I design intelligent systems
and build interactive digital experiences.

Instead of a static resume,
I created this world to showcase my work.

Walk around.
Explore.
Discover.`;

  let displayedText = "";
  let index = 0;

  const textObj = k.add([
    k.text("", {
      size: 22,
      font: "monogram",
      width: k.width() - 100,
    }),
    k.pos(50, k.height() / 2 - 100),
  ]);

  // Typing animation
  const typing = k.loop(0.03, () => {
    if (index < fullText.length) {
      displayedText += fullText[index];
      textObj.text = displayedText;
      index++;
    } else {
      typing.cancel();

      // Wait 2 seconds then fade to game
      k.wait(2, () => {
        k.go("main");
      });
    }
  });

});

// =====================================================
// MAIN SCENE
// =====================================================
k.scene("main", async () => {

  if (k.audioCtx && k.audioCtx.state !== "running") {
    await k.audioCtx.resume();
  }

  k.play("gameMusic", {
    loop: true,
    volume: 0.4,
  });

  const mapData = await (await fetch("./map.json")).json();
  const layers = mapData.layers;

  const map = k.add([
    k.sprite("map"),
    k.pos(0, 0),
    k.scale(scaleFactor),
  ]);

  const player = k.make([
    k.sprite("spritesheet", { anim: "idle-down" }),
    k.area({
      shape: new k.Rect(k.vec2(0, 3), 10, 10),
    }),
    k.body(),
    k.anchor("center"),
    k.pos(),
    k.scale(scaleFactor),
    {
      speed: 250,
      direction: "down",
      isInDialogue: false,
    },
    "player",
  ]);

  for (const layer of layers) {

    // COLLISIONS
    if (layer.name === "collisions") {
      for (const obj of layer.objects) {
        map.add([
          k.area({
            shape: new k.Rect(k.vec2(0), obj.width, obj.height),
          }),
          k.body({ isStatic: true }),
          k.pos(obj.x, obj.y),
        ]);
      }
    }

    // INTERACTABLES
    if (layer.name === "interactables") {
      for (const obj of layer.objects) {

        map.add([
          k.area({
            shape: new k.Rect(k.vec2(0), obj.width, obj.height),
          }),
          k.body({ isStatic: true }),
          k.pos(obj.x, obj.y),
          obj.name,
        ]);

        player.onCollide(obj.name, () => {

          if (player.isInDialogue) return;
          if (!dialogueData[obj.name]) return;

          player.isInDialogue = true;

          // ===== RESUME SPECIAL CASE =====
          if (obj.name === "resume") {

            displayDialogue(
              dialogueData.resume,
              () => {
                player.isInDialogue = false;

                const btn = document.createElement("button");
                btn.innerText = "Download Resume";
                btn.style.position = "absolute";
                btn.style.bottom = "40px";
                btn.style.left = "50%";
                btn.style.transform = "translateX(-50%)";
                btn.style.padding = "10px 20px";
                btn.style.background = "#222";
                btn.style.color = "#fff";
                btn.style.border = "2px solid white";
                btn.style.cursor = "pointer";
                btn.style.fontFamily = "monogram";

                document.body.appendChild(btn);

                btn.onclick = async () => {
                  try {
                    const response = await fetch("./Prakrit_Mohanty_Resume_Latest.pdf");
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);

                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "Prakrit_Mohanty_Resume_Latest.pdf";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);

                    window.URL.revokeObjectURL(url);
                  } catch (err) {
                    console.error(err);
                  }

                  document.body.removeChild(btn);
                };
              }
            );

            return;
          }

          // ===== NORMAL OBJECTS =====
          displayDialogue(
            dialogueData[obj.name],
            () => {
              player.isInDialogue = false;
            }
          );

        });
      }
    }

    // SPAWN
    if (layer.name === "spawnpoint") {
      const spawn = layer.objects[0];
      player.pos = k.vec2(
        spawn.x * scaleFactor,
        spawn.y * scaleFactor
      );
      k.add(player);
    }
  }

  setCamScale(k);
  k.onResize(() => setCamScale(k));

  k.onUpdate(() => {
    k.camPos(player.worldPos().x, player.worldPos().y - 100);
  });

  // MOVEMENT
  k.onKeyDown(() => {
    if (player.isInDialogue) return;

    if (k.isKeyDown("right")) {
      player.flipX = false;
      player.play("walk-side");
      player.direction = "right";
      player.move(player.speed, 0);
    }

    if (k.isKeyDown("left")) {
      player.flipX = true;
      player.play("walk-side");
      player.direction = "left";
      player.move(-player.speed, 0);
    }

    if (k.isKeyDown("up")) {
      player.play("walk-up");
      player.direction = "up";
      player.move(0, -player.speed);
    }

    if (k.isKeyDown("down")) {
      player.play("walk-down");
      player.direction = "down";
      player.move(0, player.speed);
    }
  });

  k.onKeyRelease(() => {
    if (player.direction === "down") player.play("idle-down");
    else if (player.direction === "up") player.play("idle-up");
    else player.play("idle-side");
  });
});

k.go("intro");