type CompassDirection = "north" | "east" | "south" | "west";

type Hint = CompassDirection | "stay";

export class State {

    private readonly _parent: BusinessCard;
    private readonly _id: number;

    private readonly _loc2tile: Array<number>;
    private readonly _tile2loc: Array<number>;

    private readonly _isSolved: boolean;

    private _northSuccessor?: State;
    private _eastSuccessor?: State;
    private _southSuccessor?: State;
    private _westSuccessor?: State;
    
    private _knownSuccessors: Set<State>;

    private _maximalSolveDistance: number;

    get id(): number {
        return this._id;
    }

    get maximalSolveDistance(): number {
        return this._maximalSolveDistance;
    }

    get isSolved(): boolean {
        return this._isSolved;
    }

    successorInDirection(direction: CompassDirection): State {
       switch (direction) {
            case "north":
                return this.northSuccessor;
            case "east":
                return this.eastSuccessor;
            case "south":
                return this.southSuccessor;
            case "west":
                return this.westSuccessor;
       } 
    }

    get northSuccessor(): State {
        if (this._northSuccessor === undefined) {
            this._northSuccessor = this._getOrCreateSuccessor("north");
        }
        return this._northSuccessor!;
    }

    get eastSuccessor(): State {
        if (this._eastSuccessor === undefined) {
            this._eastSuccessor = this._getOrCreateSuccessor("east");
        }
        return this._eastSuccessor!;
    }

    get southSuccessor(): State {
        if (this._southSuccessor === undefined) {
            this._southSuccessor = this._getOrCreateSuccessor("south");
        }
        return this._southSuccessor!;
    }

    get westSuccessor(): State {
        if (this._westSuccessor === undefined) {
            this._westSuccessor = this._getOrCreateSuccessor("west");
        }
        return this._westSuccessor!;
    }

    constructor(parent: BusinessCard, id: number, loc2tile: Array<number>) {
        this._parent = parent;
        this._id = id;
        this._loc2tile = loc2tile;
        this._tile2loc = new Array(this._loc2tile.length);
        this._loc2tile.forEach((tileId, locId) => this._tile2loc[tileId] = locId);
        this._isSolved = this._loc2tile.findIndex((tileId, locId) => tileId !== locId) === -1;
        this._maximalSolveDistance = Number.POSITIVE_INFINITY;
        this._knownSuccessors = new Set();
        this._parent._dirtySolveDistance(this);
    }

    _linkExistingSuccessors() {
        const northSuccessor = this._getSuccessorIfExists("north");
        if (northSuccessor !== undefined) {
            this._northSuccessor = northSuccessor;
            this._knownSuccessors.add(northSuccessor);
            if (northSuccessor !== this) {
                northSuccessor._southSuccessor = this;
                northSuccessor._knownSuccessors.add(this);
                this._parent._dirtySolveDistance(northSuccessor);
            }
        }
        const eastSuccessor =this._getSuccessorIfExists("east");
        if (eastSuccessor !== undefined) {
            this._eastSuccessor = eastSuccessor;
            this._knownSuccessors.add(eastSuccessor);
            if (eastSuccessor !== this) {
                eastSuccessor._westSuccessor = this;
                eastSuccessor._knownSuccessors.add(this);
                this._parent._dirtySolveDistance(eastSuccessor);
            }
        }
        const southSuccessor = this._getSuccessorIfExists("south");
        if (southSuccessor !== undefined) {
            this._southSuccessor = southSuccessor;
            this._knownSuccessors.add(southSuccessor);
            if (southSuccessor !== this) {
                southSuccessor._northSuccessor = this;
                southSuccessor._knownSuccessors.add(this);
                this._parent._dirtySolveDistance(southSuccessor);
            }
        }
        const westSuccessor = this._getSuccessorIfExists("west");
        if (westSuccessor !== undefined) {
            this._westSuccessor = westSuccessor;
            this._knownSuccessors.add(westSuccessor);
            if (westSuccessor !== this) {
                westSuccessor._eastSuccessor = this;
                westSuccessor._knownSuccessors.add(this);
                this._parent._dirtySolveDistance(westSuccessor);
            }
        }
    }

    potentialMaximalSolveDistance(maximalSolveDistance: number): State {
        if (this._maximalSolveDistance > maximalSolveDistance) {
            this._maximalSolveDistance = maximalSolveDistance;
            for (const knownSuccessor of this._knownSuccessors) {
                this._parent._dirtySolveDistance(knownSuccessor);
            }
        }
        return this;
    }

    potentialSolveDistance(solveDistance: number): State {
        return this.potentialMaximalSolveDistance(solveDistance);
    }

    _successorLocIds(direction: CompassDirection): Iterable<number> {
        const horTiles = this._parent.horTiles;
        const verTiles = this._parent.verTiles;
        const holeLoc = this.holeLoc;
        const [holeHor, holeVer] = this.holePos;
        const swap = (swapLoc: number): Iterable<number> => 
            function*(loc2tile: Array<number>, swapLoc, holeLoc): Iterable<number> {
                for (let i = 0; i < loc2tile.length; i++) {
                    yield loc2tile[i === swapLoc ? holeLoc : ((i === holeLoc) ? swapLoc : i)]!;
                }
            }(this._loc2tile, swapLoc, holeLoc);
        switch (direction) {
            case "north":
                return (holeVer > 0) ? swap(holeLoc - horTiles) : this._loc2tile.values();
            case "east":
                return (holeHor+1 < horTiles) ? swap(holeLoc + 1) : this._loc2tile.values();
            case "south":
                return (holeVer+1 < verTiles) ? swap(holeLoc + horTiles) : this._loc2tile.values();
            case "west":
                return (holeHor > 0) ? swap(holeLoc - 1) : this._loc2tile.values();
        }
    }

    _getOrCreateSuccessor(direction: CompassDirection): State {
        return this._parent._getOrCreateState(this._successorLocIds(direction));
    }

    _getSuccessorIfExists(direction: CompassDirection) {
        return this._parent._getStateIfExists(this._successorLocIds(direction));
    }

    knownSuccessors(): Iterable<State> {
        return this._knownSuccessors.values();
    }

    successors(): Iterable<State> {
        // ensure existence of successors in all directions
        [this.northSuccessor, this.eastSuccessor, this.southSuccessor, this.westSuccessor]; 
        return this._knownSuccessors.values();
    }

    hasAllSuccessorsKnown() {
        return this._northSuccessor !== undefined 
        && this._eastSuccessor !== undefined 
        && this._southSuccessor !== undefined 
        && this._westSuccessor !== undefined;
    }

    hasSomeSuccessorKnown() {
        return this._northSuccessor !== undefined 
        || this._eastSuccessor !== undefined 
        || this._southSuccessor !== undefined 
        || this._westSuccessor !== undefined;
    }

    performSolveDistanceDataflowStep() {
        if (this.isSolved) {
            this.potentialSolveDistance(0);
            return;
        }
        if (this.hasSomeSuccessorKnown()) {
            let minMax = Number.POSITIVE_INFINITY;
            for (const successor of this._knownSuccessors) {
                minMax = Math.min(successor._maximalSolveDistance, minMax);
            }
            this.potentialMaximalSolveDistance(minMax + 1);
        }
    }

    tileIndexAtLoc(locIndex: number): number {
        return this._loc2tile[locIndex]!;
    }

    tileIndexAtPos([h, v]: [number, number]): number {
        return this.tileIndexAtLoc((v * this._parent.horTiles) + h);
    }

    get holeLoc(): number {
        return this._tile2loc[this._parent.holeIndex]!;
    }

    get holePos(): [number, number] {
        const holeLoc = this.holeLoc;
        const hor = holeLoc % this._parent.horTiles;
        const ver = Math.max(0, Math.min(Math.floor(holeLoc / this._parent.horTiles), this._parent.verTiles-1));
        return [hor, ver];
    }
    
    minMaxSuccessor() {
        let pessimisticSuccessor: State = this;
        for (const knownSuccessor of this._knownSuccessors) {
            if (knownSuccessor._maximalSolveDistance < pessimisticSuccessor._maximalSolveDistance) {
                pessimisticSuccessor = knownSuccessor;
            }
        }
        return pessimisticSuccessor;
    }

    minMaxHint(): Hint {
        const minMaxSuccessor = this.minMaxSuccessor();
        if (this === minMaxSuccessor) {
            return "stay";
        } else if (this._northSuccessor === minMaxSuccessor) {
            return "north";
        } else if (this._eastSuccessor === minMaxSuccessor) {
            return "east";
        } else if (this._southSuccessor === minMaxSuccessor) {
            return "south";
        } else { // (this._westSuccessor === pessimisticSuccessor)
            return "west";
        }   
    }
}

export class BusinessCard {
    
    private readonly _horTiles: number;
    private readonly _verTiles: number;
    private readonly _tileSize: number;
    private readonly _borderSize: number;

    private readonly _holeIndex: number;

    private readonly _graphics: { wholeCard: HTMLCanvasElement, tiles: Array<HTMLCanvasElement>, background: HTMLCanvasElement};

    private readonly _canonicalStates: Map<string, State>;

    private _solvedState: State;
    private _currentState: State;
    private _previousState: State;
    private _transitionProgress: number;

    private readonly _dirtySolveDistanceStates: Set<State>;

    private _showHints: boolean;

    private readonly _hintTiles: Map<Hint, HTMLCanvasElement>;

    private _route: Array<State>|undefined;

    private _done: boolean;
    private _doneLink: string;

    get done(): boolean {
        return this._done;
    }

    set done(to: boolean) {
        this._done = to;
    }

    get currentState(): State {
        return this._currentState;
    }

    set currentState(to: State) {
        this._currentState = to;
        this._route = undefined;
    }
    
    get previousState(): State {
        return this._previousState;
    }

    set previousState(to: State) {
        this._previousState = to;
    }

    get transitionProgress(): number {
        return this._transitionProgress;
    }

    set transitionProgress(to: number) {
        this._transitionProgress = to;
    }

    get showHints(): boolean {
        return this._showHints;
    }

    set showHints(to: boolean) {
        this._showHints = to;
    }

    get horTiles(): number {
        return this._horTiles;
    }

    get verTiles(): number {
        return this._verTiles;
    }

    get holeIndex(): number {
        return this._holeIndex;
    }

    get tileSize(): number {
        return this._tileSize;
    }

    get borderSize(): number {
        return this._borderSize;
    }
    
    constructor(horTiles: number, verTiles: number, tileSize: number, borderSize: number, painter: (ctx: CanvasRenderingContext2D, background: boolean) => void, [holeHor, holeVer]: [number, number], scrambleSteps: number, doneLink: string) {
        
        this._horTiles = horTiles;
        this._verTiles = verTiles;
        this._tileSize = tileSize;
        this._borderSize = borderSize;
        this._holeIndex = holeVer * horTiles + holeHor;

        const innerWidth = horTiles * tileSize;
        const innerHeight = verTiles * tileSize;

        const width = innerWidth + 2 * borderSize;
        const height = innerHeight + 2 * borderSize;
        
        const wholeCard = document.createElement("canvas");
        wholeCard.width = width;
        wholeCard.height = height;
        painter(wholeCard.getContext("2d")!, false);
        const tiles = new Array(verTiles * horTiles);
        for (let v = 0; v < verTiles; v++) {
            for (let h = 0; h < horTiles; h++) {
                const tile = document.createElement("canvas");
                tile.width = tileSize;
                tile.height = tileSize;
                const ctx = tile.getContext("2d")!;
                ctx.drawImage(wholeCard, borderSize + h * tileSize, borderSize + v * tileSize, tileSize, tileSize, 0, 0, tileSize, tileSize);
                ctx.strokeStyle = "rgba(80, 80, 80, .4)";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.rect(0, 0, tileSize, tileSize);
                ctx.stroke();
                tiles[v * horTiles + h] = tile; 
            }
        }
        const background = document.createElement("canvas");
        background.width = width;
        background.height = height;
        painter(background.getContext("2d")!, true);
        this._graphics = { wholeCard: wholeCard, tiles: tiles, background: background };

        this._canonicalStates = new Map();
        this._dirtySolveDistanceStates = new Set();

        this._solvedState = this._getOrCreateState((function*(n: number): Iterable<number>  {
            for (let i = 0; i < n; i++) {
                yield i;
            }
        })(horTiles * verTiles)).potentialSolveDistance(0);   
        this._currentState = this._solvedState;
        const allDirections: Array<CompassDirection> = ["north", "east", "south", "west"];
        while (scrambleSteps > 0) {
            const randomIndex = Math.min(3, Math.max(0, Math.floor(Math.random() * 4)));
            const randomDirection = allDirections[randomIndex]!;
            this._currentState = this._currentState.successorInDirection(randomDirection);
            scrambleSteps--;
        }
        this._previousState = this._currentState;
        this._transitionProgress = 1.0;

        const createBlankHintTile = (): HTMLCanvasElement => {
            const blankHintTile = document.createElement("canvas");
            blankHintTile.width = tileSize;
            blankHintTile.height = tileSize;
            return blankHintTile;
        }

        const createDirectionHintTile = (angle: number): HTMLCanvasElement => {
            const hintTile = createBlankHintTile();
            const ctx = hintTile.getContext("2d")!;
            ctx.translate(tileSize/2, tileSize/2);
            ctx.rotate(angle);
            ctx.fillStyle = "rgba(147,230,32, 1)";
            ctx.beginPath();
            const [a, b, c, d, e] = [.1 * tileSize, .1 * tileSize, .2 * tileSize, .2 * tileSize, -.5 * tileSize];
            ctx.moveTo(-a, e);
            ctx.lineTo(a, e);
            ctx.lineTo(a, e + c);
            ctx.lineTo(a + b, e + c);
            ctx.lineTo(0, e + c + d);
            ctx.lineTo(-a - b, e + c);
            ctx.lineTo(-a, e + c);
            ctx.lineTo(-a, e);
            ctx.fill();
            return hintTile;
        }

        this._showHints = false;

        const hintTiles: Map<Hint, HTMLCanvasElement> = new Map();
        hintTiles.set("stay", createBlankHintTile());
        hintTiles.set("north", createDirectionHintTile(0));
        hintTiles.set("east", createDirectionHintTile(.5 * Math.PI));
        hintTiles.set("south", createDirectionHintTile(Math.PI));
        hintTiles.set("west", createDirectionHintTile(1.5 * Math.PI));

        this._hintTiles = hintTiles;

        this.performSolveDistanceDataflowAnalysis();

        this._done = false;
        this._doneLink = doneLink;
    }

    states(): Iterable<State> {
        return this._canonicalStates.values();
    }

    performSolveDistanceDataflowAnalysis() {
        let closure = false;
        while (!closure) {
            closure = this.performSolveDistanceDataflowStep();
        }
    }

    performSolveDistanceDataflowStep(): boolean {
        const state = pickAndRemoveFrom(this._dirtySolveDistanceStates);
        if (state === null) {
            return true;
        }
        state.performSolveDistanceDataflowStep();
        return false;
    }

    _dirtySolveDistance(state: State) {
        this._dirtySolveDistanceStates.add(state);
    }

    _getOrCreateState(tileLoc: Iterable<number>): State {
        const loc2tile = [...tileLoc];
        const id = loc2tile.join(",");
        if (!this._canonicalStates.has(id)) {
            const state = new State(this, this._canonicalStates.size, loc2tile);
            this._canonicalStates.set(id, state);
            state._linkExistingSuccessors();
            this._route = undefined;
        }
        return this._canonicalStates.get(id)!;
    }

    _getStateIfExists(tileLoc: Iterable<number>): State|undefined {
        const loc2tile = [...tileLoc];
        const id = loc2tile.join(",");
        return this._canonicalStates.get(id);
    }

    draw(ctx: CanvasRenderingContext2D) {
        
        const horTiles = this._horTiles;
        const verTiles = this._verTiles;
        const tileSize = this._tileSize;
        const borderSize = this._borderSize;

        const { wholeCard: wholeCard, tiles: tiles, background: background } = this._graphics;

        if (this._done && this._previousState === this._currentState) {
            ctx.drawImage(wholeCard, 0, 0);
            return;
        }

        ctx.drawImage(background, 0, 0);

        const transitionState = this._previousState;
        const currentState = this._currentState;

        const [h1, v1] = transitionState.holePos;
        const [h2, v2] = currentState.holePos;
        
        for (let v = 0; v < verTiles; v++) {
            for (let h = 0; h < horTiles; h++) {
                if (!((h === h1 && v === v1) || (h === h2 && v === v2))) {
                    const tileIndex = currentState.tileIndexAtPos([h, v]);
                    const tile = tiles[tileIndex]!;
                    ctx.drawImage(tile, borderSize + h * tileSize, borderSize + v * tileSize);    
                }
            }
        }

        if (transitionState !== currentState) {
            const transitioningTileIndex = transitionState.tileIndexAtPos([h2, v2]);
            const transitioningTile = tiles[transitioningTileIndex]!;
            const c = this._transitionProgress * this._transitionProgress;
            const h = (c * h1 + (1 - c) * h2);
            const v = (c * v1 + (1 - c) * v2);
            ctx.drawImage(transitioningTile, borderSize + h * tileSize, borderSize + v * tileSize);
            this._transitionProgress = Math.min(1.0, this._transitionProgress + .05);
            if (this._transitionProgress >= 1.0) {
                this._previousState = this._currentState;
            }
        } else if (this.showHints) {
            ctx.drawImage(this._hintTiles.get(currentState.minMaxHint())!, borderSize + h1 * tileSize, borderSize + v1 * tileSize);
        }

    }

    click(x: number, y: number) {
        if (this._done) {
            if (this._doneLink !== undefined) {
                location.href=this._doneLink;
            }
            return;
        }
        const tileSize = this._tileSize;
        const borderSize = this._borderSize;
        const currentState = this._currentState;
        const [holeHor, holeVer] = currentState.holePos;
        const holeCenterX = borderSize + (holeHor + .5) * tileSize;
        const holeCenterY = borderSize + (holeVer + .5) * tileSize;
        const dx = x - holeCenterX;
        const dy = y - holeCenterY;
        if (Math.abs(dx) < .1 * tileSize && Math.abs(dy) < .1 * tileSize) {
            // click is too close to hole center, do nothing in order not to confuse user
            return;
        }
        const northEastOfDownwardDiagonal = ((dx - dy) > 0);
        const southEastOfUpwardDiagonal = ((dx + dy) > 0);
        let successorState: State;
        if (northEastOfDownwardDiagonal && !southEastOfUpwardDiagonal) {
            // click is in northward cone from hole center
            successorState = currentState.northSuccessor;
        } else if (northEastOfDownwardDiagonal && southEastOfUpwardDiagonal) { 
            // click is in eastward cone from hole center
            successorState = currentState.eastSuccessor;
        } else if (!northEastOfDownwardDiagonal && southEastOfUpwardDiagonal) {
            // click is in southward cone from hole center
            successorState = currentState.southSuccessor;
        } else { // (!northEastOfDownwardDiagonal && !southEastOfUpwardDiagonal)
            // click is in westward cone from hole center
            successorState = currentState.westSuccessor;
        }
        this.transitionProgress = 0.0;
        this.previousState = currentState;
        this.currentState = successorState;
        this.performSolveDistanceDataflowAnalysis();
    }

    route(): Array<State> {
        if (this._route === undefined) {
            this.performSolveDistanceDataflowAnalysis();
            let state = this._currentState;
            const route = [state];
            while (state !== this._solvedState) {
                let bestSuccState;
                for (const knownSuccState of state.knownSuccessors()) {
                    if (bestSuccState === undefined || knownSuccState.maximalSolveDistance < bestSuccState.maximalSolveDistance) {
                        bestSuccState = knownSuccState;
                    }
                }
                if (bestSuccState === undefined) {
                    break;
                }
                route.push(bestSuccState);
                state = bestSuccState;
            }
            this._route = route;
        }
        return this._route;
    }
}

function pickAndRemoveFrom<T>(set: Set<T>): T|null {
    let picked: T|null = null;
    for (const elem of set) {
        picked = elem;
        break;
    }
    if (picked !== null) {
        set.delete(picked);
    }
    return picked;
}