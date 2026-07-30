import type { Rational, Recipe } from "./types"

// The resource priority model, ported from legacy/priority.js. That version
// carried a d3 selection on every node and maintained DOM order by hand, which
// is why adding a level had to work out its successor node and whether it needed
// a "middle" divider. Order is derived from the arrays here; ResourcesTab.vue
// renders the dividers from each level's position.

export class PriorityResource {
    level: PriorityLevel | null = null

    constructor(
        readonly recipe: Recipe,
        public weight: Rational,
    ) {}

    // Detaches this resource from its level, removing the level if that empties
    // it. The resource is then free to be inserted somewhere else.
    remove(): void {
        if (this.level === null) {
            return
        }
        const i = this.level.resources.indexOf(this)
        if (i !== -1) {
            this.level.resources.splice(i, 1)
        }
        if (this.level.isEmpty()) {
            this.level.remove()
        }
        this.level = null
    }
}

let nextLevelId = 0

export class PriorityLevel {
    // Stable identity for rendering; levels are otherwise anonymous.
    readonly id = nextLevelId++
    resources: PriorityResource[] = []

    constructor(readonly list: PriorityList) {}

    [Symbol.iterator](): Iterator<PriorityResource> {
        return this.resources[Symbol.iterator]()
    }

    equalMap(m: Map<Recipe, Rational>): boolean {
        if (m.size !== this.resources.length) {
            return false
        }
        for (const { recipe, weight } of this) {
            const other = m.get(recipe)
            if (other === undefined || !other.equal(weight)) {
                return false
            }
        }
        return true
    }

    has(resource: PriorityResource): boolean {
        return resource.level === this
    }

    // It is an error to call this on a level that still holds resources.
    remove(): void {
        if (this.resources.length !== 0) {
            throw new Error("cannot remove non-empty PriorityLevel")
        }
        this.list.removeEmptyLevels()
    }

    isEmpty(): boolean {
        return this.resources.length === 0
    }

    // Moves the resource to this level, ordered by descending weight, removing
    // it from its old level and dropping that level if it empties.
    insertSorted(resource: PriorityResource): void {
        if (resource.level === this && this.resources.length === 1) {
            return
        } else if (resource.level !== null) {
            // Detaching can empty the old level, whose removal sweeps every empty
            // level -- including this one when it was just created for this
            // insert. Shield it for the duration.
            this.list.insertTarget = this
            try {
                resource.remove()
            } finally {
                this.list.insertTarget = null
            }
        }
        resource.level = this
        for (let i = 0; i < this.resources.length; i++) {
            if (this.resources[i]!.weight.less(resource.weight)) {
                this.resources.splice(i, 0, resource)
                return
            }
        }
        this.resources.push(resource)
    }
}

export class PriorityList {
    // The level an insert is currently targeting, exempt from empty-level
    // collection. See PriorityLevel.insertSorted.
    insertTarget: PriorityLevel | null = null
    // Semicolon required: without it the computed method name below parses as an
    // index into this initialiser.
    priorities: PriorityLevel[] = [];

    [Symbol.iterator](): Iterator<PriorityLevel> {
        return this.priorities[Symbol.iterator]()
    }

    static fromArray(a: Array<Map<Recipe, Rational>>): PriorityList {
        const p = new PriorityList()
        for (const m of a) {
            const level = p.addPriorityBefore(null)
            for (const [recipe, weight] of m) {
                p.addRecipe(recipe, weight, level)
            }
        }
        return p
    }

    applyArray(a: Array<Map<Recipe, Rational>>): void {
        for (let i = 0; i < a.length; i++) {
            while (this.priorities.length < i + 1) {
                this.addPriorityBefore(null)
            }
            const level = this.priorities[i]!
            for (const [recipe, weight] of a[i]!) {
                const resource = this.getResource(recipe)
                if (resource === null) {
                    this.addRecipe(recipe, weight, level)
                } else {
                    level.insertSorted(resource)
                }
            }
        }
    }

    equalArray(a: Array<Map<Recipe, Rational>>): boolean {
        if (a.length !== this.priorities.length) {
            return false
        }
        for (let i = 0; i < a.length; i++) {
            if (!this.priorities[i]!.equalMap(a[i]!)) {
                return false
            }
        }
        return true
    }

    // Creates a level immediately before the given one, or at the end of the
    // list when it is null.
    addPriorityBefore(level: PriorityLevel | null): PriorityLevel {
        const newLevel = new PriorityLevel(this)
        if (level === null) {
            this.priorities.push(newLevel)
            return newLevel
        }
        const i = this.priorities.indexOf(level)
        if (i === -1) {
            this.priorities.push(newLevel)
        } else {
            this.priorities.splice(i, 0, newLevel)
        }
        return newLevel
    }

    getFirstLevel(): PriorityLevel | null {
        return this.priorities.length === 0 ? null : this.priorities[0]!
    }

    getLastLevel(): PriorityLevel | null {
        return this.priorities.length === 0
            ? null
            : this.priorities[this.priorities.length - 1]!
    }

    setPriority(resource: PriorityResource, level: PriorityLevel): void {
        level.insertSorted(resource)
    }

    addRecipe(recipe: Recipe, weight: Rational, level: PriorityLevel): void {
        level.insertSorted(new PriorityResource(recipe, weight))
    }

    getResource(recipe: Recipe): PriorityResource | null {
        for (const level of this.priorities) {
            for (const resource of level.resources) {
                if (resource.recipe === recipe) {
                    return resource
                }
            }
        }
        return null
    }

    getWeight(recipe: Recipe): Rational {
        return this.getResource(recipe)!.weight
    }

    removeRecipe(recipe: Recipe): void {
        this.getResource(recipe)?.remove()
    }

    removeEmptyLevels(): void {
        this.priorities = this.priorities.filter(
            (level) => !level.isEmpty() || level === this.insertTarget,
        )
    }
}
