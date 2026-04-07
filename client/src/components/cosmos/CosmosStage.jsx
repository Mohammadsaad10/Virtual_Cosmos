import { Application, Container, Graphics } from "pixi.js";
import { useEffect, useRef } from "react";

/**
 * Converts hexadecimal color string into numeric Pixi color format.
 *
 * @param {string} colorHex - Color in #RRGGBB format.
 * @returns {number} Numeric color.
 */
function toPixiColor(colorHex) {
  return Number.parseInt(String(colorHex || "#67e8f9").replace("#", ""), 16);
}

/**
 * Renders the virtual cosmos using PixiJS and updates avatars in real time.
 *
 * @param {{
 *   users: Array<{ userId: string, avatarColor: string, position: { x: number, y: number } }>,
 *   selfUserId: string,
 *   worldWidth: number,
 *   worldHeight: number,
 *   proximityRadius: number
 * }} props - Cosmos stage props.
 * @returns {JSX.Element} Pixi host container.
 */
export function CosmosStage({
  users,
  selfUserId,
  worldWidth,
  worldHeight,
  proximityRadius,
}) {
  const hostRef = useRef(null);
  const appRef = useRef(null);
  const worldLayerRef = useRef(null);

  useEffect(() => {
    let disposed = false;

    /**
     * Boots Pixi application and attaches canvas to host container.
     */
    const setup = async () => {
      if (!hostRef.current) {
        return;
      }

      const app = new Application();
      await app.init({
        backgroundAlpha: 0,
        antialias: true,
        resizeTo: hostRef.current,
      });

      if (disposed) {
        app.destroy();
        return;
      }

      hostRef.current.appendChild(app.canvas);

      const layer = new Container();
      app.stage.addChild(layer);

      appRef.current = app;
      worldLayerRef.current = layer;
    };

    setup().catch(() => null);

    return () => {
      disposed = true;
      worldLayerRef.current = null;

      if (appRef.current) {
        appRef.current.destroy();
        appRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const app = appRef.current;
    const layer = worldLayerRef.current;

    if (!app || !layer) {
      return;
    }

    layer.removeChildren();

    const width = app.renderer.width;
    const height = app.renderer.height;

    const scaleX = width / worldWidth;
    const scaleY = height / worldHeight;

    const background = new Graphics();
    background.rect(0, 0, width, height).fill({ color: 0x0f172a, alpha: 0.92 });
    layer.addChild(background);

    const grid = new Graphics();
    const spacing = 80;

    for (let x = 0; x <= width; x += spacing) {
      grid.moveTo(x, 0).lineTo(x, height);
    }

    for (let y = 0; y <= height; y += spacing) {
      grid.moveTo(0, y).lineTo(width, y);
    }

    grid.stroke({ color: 0x38bdf8, width: 1, alpha: 0.08 });
    layer.addChild(grid);

    const selfUser = users.find((user) => user.userId === selfUserId);
    if (selfUser) {
      const centerX = selfUser.position.x * scaleX;
      const centerY = selfUser.position.y * scaleY;
      const scaledRadius = proximityRadius * ((scaleX + scaleY) / 2);

      const radiusRing = new Graphics();
      radiusRing
        .circle(centerX, centerY, scaledRadius)
        .stroke({ color: 0x22d3ee, width: 2, alpha: 0.25 });
      layer.addChild(radiusRing);
    }

    for (const user of users) {
      const x = user.position.x * scaleX;
      const y = user.position.y * scaleY;
      const isSelf = user.userId === selfUserId;

      const avatar = new Graphics();
      avatar.circle(x, y, isSelf ? 14 : 12).fill({
        color: toPixiColor(user.avatarColor),
        alpha: 0.95,
      });
      avatar.circle(x, y, isSelf ? 16 : 14).stroke({
        color: isSelf ? 0xf0f9ff : 0x0f172a,
        width: 2,
        alpha: 0.9,
      });

      layer.addChild(avatar);
    }
  }, [users, selfUserId, worldWidth, worldHeight, proximityRadius]);

  return (
    <div
      ref={hostRef}
      className="h-[58vh] min-h-105 w-full overflow-hidden rounded-xl"
    />
  );
}
