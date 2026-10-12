/**
 * QuadTree для пространственного разбиения — ускоряет поиск коллизий
 * при большом количестве врагов (>300).
 */

/** Объект, который можно поместить в QuadTree (должен иметь позицию и радиус) */
export interface QuadTreeEntity {
  x: number;
  y: number;
  radius: number;
}

/** Границы области QuadTree */
interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MAX_OBJECTS = 8;
const MAX_DEPTH = 6;

export class QuadTree<T extends QuadTreeEntity> {
  private readonly bounds: Bounds;
  private readonly depth: number;
  private objects: T[] = [];
  private nodes: QuadTree<T>[] | null = null;

  constructor(bounds: Bounds, depth = 0) {
    this.bounds = bounds;
    this.depth = depth;
  }

  /** Очистка дерева перед новым кадром */
  clear(): void {
    this.objects = [];
    if (this.nodes) {
      for (const node of this.nodes) {
        node.clear();
      }
      this.nodes = null;
    }
  }

  /** Вставка объекта в дерево */
  insert(entity: T): void {
    if (this.nodes) {
      const index = this.getIndex(entity);
      if (index !== -1) {
        this.nodes[index].insert(entity);
        return;
      }
    }

    this.objects.push(entity);

    if (this.objects.length > MAX_OBJECTS && this.depth < MAX_DEPTH) {
      if (!this.nodes) {
        this.split();
      }

      let i = 0;
      while (i < this.objects.length) {
        const index = this.getIndex(this.objects[i]);
        if (index !== -1) {
          this.nodes![index].insert(this.objects.splice(i, 1)[0]);
        } else {
          i++;
        }
      }
    }
  }

  /** Поиск всех объектов в радиусе от точки */
  queryRadius(x: number, y: number, radius: number, results: T[]): void {
    if (
      x + radius < this.bounds.x ||
      x - radius > this.bounds.x + this.bounds.width ||
      y + radius < this.bounds.y ||
      y - radius > this.bounds.y + this.bounds.height
    ) {
      return;
    }

    for (const obj of this.objects) {
      const dist = Math.hypot(obj.x - x, obj.y - y);
      if (dist <= radius + obj.radius) {
        results.push(obj);
      }
    }

    if (this.nodes) {
      for (const node of this.nodes) {
        node.queryRadius(x, y, radius, results);
      }
    }
  }

  /** Определение индекса дочернего квадранта */
  private getIndex(entity: T): number {
    const verticalMid = this.bounds.x + this.bounds.width / 2;
    const horizontalMid = this.bounds.y + this.bounds.height / 2;

    const top = entity.y - entity.radius < horizontalMid;
    const bottom = entity.y + entity.radius > horizontalMid;
    const left = entity.x - entity.radius < verticalMid;
    const right = entity.x + entity.radius > verticalMid;

    if (top && !bottom) {
      if (right && !left) return 0;
      if (left && !right) return 1;
    } else if (bottom && !top) {
      if (left && !right) return 2;
      if (right && !left) return 3;
    }

    return -1;
  }

  /** Разделение узла на 4 дочерних квадранта */
  private split(): void {
    const { x, y, width, height } = this.bounds;
    const hw = width / 2;
    const hh = height / 2;

    this.nodes = [
      new QuadTree<T>({ x: x + hw, y, width: hw, height: hh }, this.depth + 1),
      new QuadTree<T>({ x, y, width: hw, height: hh }, this.depth + 1),
      new QuadTree<T>({ x, y: y + hh, width: hw, height: hh }, this.depth + 1),
      new QuadTree<T>({ x: x + hw, y: y + hh, width: hw, height: hh }, this.depth + 1),
    ];
  }
}
