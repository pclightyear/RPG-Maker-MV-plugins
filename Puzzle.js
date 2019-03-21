//=============================================================================
// Puzzle.js Ver 1.2
//=============================================================================
// Ver 1.2
// 1. 修正按放棄會得到道具的 bug
// 2. 修正 8*6 拼圖碎塊不會固定的 bug
// 3. 把存 puzzle 資訊的 Variable 編號參數化 (puzzle_variable_id, puzzle_finish_switch_id)
//
// Ver 1.1 
// 1. 新增功能，可以支援複數拼圖。
// 2. 移除在 plugin manager 內 puzzlebitmap、puzzlebackgroundbitmap、rowpieces、columnpieces等參數。
// 
// Ver 1.0 
// 1. 釋出

/*:
 * @plugindesc 大風吹拼圖插件 Ver1.2  請記得去看Help!
 * @author 正恩
 * 
 * @param puzzlewidth
 * @desc 拼圖寬度(pixel)
 * 預設值為 720
 * @default 720
 * 
 * @param puzzleheight
 * @desc 拼圖高度(pixel)
 * 預設值為 540
 * @default 540
 * 
 * @param giveupbutton
 * @desc 放棄按鈕的圖檔
 * 圖檔請放在 img/pictures 的資料夾裡面
 * @default
 * 
 * @param giveupbuttonhover
 * @desc 當滑鼠移到放棄按鈕上時的圖檔
 * 圖檔請放在 img/pictures 的資料夾裡面
 * @default
 * 
 * @param resetbutton
 * @desc 重置按鈕的圖檔
 * 圖檔請放在 img/pictures 的資料夾裡面
 * @default
 * 
 * @param resetbuttonhover
 * @desc 當滑鼠移到重置按鈕上時的圖檔
 * 圖檔請放在 img/pictures 的資料夾裡面
 * @default
 * 
 * @param finishbutton
 * @desc 完成按鈕的圖檔
 * 圖檔請放在 img/pictures 的資料夾裡面
 * @default
 * 
 * @param finishbuttonhover
 * @desc 當滑鼠移到完成按鈕上時的圖檔
 * 圖檔請放在 img/pictures 的資料夾裡面
 * @default
 * 
 * @param puzzle_variable_id
 * @desc 存放拼圖資訊的 Variable 編號，務必確保其他程式不會動到此參數
 * @default 4
 * 
 * @param puzzle_finish_switch_id
 * @desc 存放拼圖是否完成的 Switch 編號"起始位置"，務必確保其他程式不會動到這個與其後面數個參數(一個拼圖一個switch)
 * @default 6
 * 
 * @help  
 * 在 mv 內請以下面的方式撰寫 script:
 *    
 * SceneManager.push( Scene_Puzzle );
 * SceneManager.prepareNextScene(  puzzleId, puzzlebitmap, puzzlebackgroundbitmap, rowpieces, columnpieces );
 * 參數介紹:
 * puzzleId: 每個拼圖的編號，不可重複(可以從1或0往後編)。
 * puzzlebitmap: 拼圖的圖檔名稱
 * puzzlebackgroundbitmap: 拼圖背景圖(4*3 或 8*6的拼圖)
 * rowpieces: 一橫列拼圖的碎塊個數。
 * columnpieces: 一直行拼圖的碎塊個數。
 *
 * 範例:
 * SceneManager.push( Scene_Puzzle );
 * SceneManager.prepareNextScene( 1, "test", "拼圖_4x3", 4, 3 );
 */

 // 參數
var parameters = PluginManager.parameters('Puzzle');
var puzzlewidth = Number(parameters['puzzlewidth'] || 720);
var puzzleheight = Number(parameters['puzzleheight'] || 540);
var puzzle_variable_id = Number(parameters['puzzle_variable_id'] || 4);
var puzzle_finish_switch_id = Number(parameters['puzzle_finish_switch_id'] || 6);
var giveupbutton = parameters['giveupbutton'] || '';
var giveupbuttonhover = parameters['giveupbuttonhover'] || '';
var resetbutton = parameters['resetbutton'] || '';
var resetbuttonhover = parameters['resetbuttonhover'] || '';
var finishbutton = parameters['finishbutton'] || '';
var finishbuttonhover = parameters['finishbuttonhover'] || '';
var backScene = Scene_Map;
var framewindowWidth = 1008;
var framewindowHeight = 768;
var originoffsetX = 54;
var originoffsetY = 114;
var piecesinitrect_x = 180;
var piecesinitrect_y = 360;
var buttonwidth = 180;
var buttonheight = 70;
var prioritydefaultmin = 10;
var prioritydefaultmax = 80;
var prioritymax = 100000;
var prioritysolved = 5;

// //-----------------------------------------------------------------------------
// Scene_Puzzle
//
// 拼圖遊戲的場景(scene)

function Scene_Puzzle() {
    this.initialize.apply(this, arguments);
}

Scene_Puzzle.prototype = Object.create(Scene_Base.prototype);
Scene_Puzzle.prototype.constructor = Scene_Puzzle;

Scene_Puzzle.prototype.initialize = function() {
    // console.log('Scene_Puzzle init!');
    Scene_Base.prototype.initialize.call(this);
};

Scene_Puzzle.prototype.prepare = function(_puzzleId, _puzzlebitmap, _puzzlebackgroundbitmap, _rowpieces, _columnpieces) {
    // console.log('Scene_Puzzle prepared!');
    this.puzzleId = _puzzleId;
    this.puzzlebitmap = _puzzlebitmap;
    this.puzzlebackgroundbitmap = _puzzlebackgroundbitmap;
    this.rowpieces = _rowpieces;
    this.columnpieces = _columnpieces;
    if(this.rowpieces === 4) {
        this.piecesolvemaxgap = 15;
    }
    else if(this.rowpieces === 8) {
        this.piecesolvemaxgap = 5;
    }
};

//將自訂視窗建立於場景上
Scene_Puzzle.prototype.create = function() {
    Scene_Base.prototype.create.call(this);
    // console.log('Scene_Puzzle created!');
    this.createBackground();
    this.createButton();
    this.createPuzzlePieces();

};

Scene_Puzzle.prototype.start = function() {
    Scene_MenuBase.prototype.start.call(this);
};

//畫面更新
Scene_Puzzle.prototype.update = function(){
    Scene_MenuBase.prototype.update.call(this);

    //按鈕
    if(this._resetbutton) {
        this._resetbutton.bitmap = (this.isButtonHover(this._resetbutton)) ? 
                                   ImageManager.loadPicture( resetbuttonhover ) : 
                                   ImageManager.loadPicture( resetbutton );

        this._resetbutton.processTouch();
    }
    if(this._giveupbutton) {
        this._giveupbutton.bitmap = (this.isButtonHover(this._giveupbutton)) ? 
                                    ImageManager.loadPicture( giveupbuttonhover ) : 
                                    ImageManager.loadPicture( giveupbutton );

        this._giveupbutton.processTouch();
    }
    if(this._finishbutton && this._finishbutton.visible) {
        this._finishbutton.bitmap = (this.isButtonHover(this._finishbutton)) ? 
                                    ImageManager.loadPicture( finishbuttonhover ) : 
                                    ImageManager.loadPicture( finishbutton );
        this._finishbutton.processTouch();
    }


    //確認滑鼠按在拼圖上
    if( TouchInput.isTriggered() ) {
        var valid = false;
        for(var i = 0; i < this.columnpieces; ++i) {
            for(var j = 0; j < this.rowpieces; ++j) {
                this.getMousePosition();
                if( this.isInPuzzlePieces( this._PuzzlePieces[i][j], this._MouseX, this._MouseY ) ) {
                    valid = true;
                }
            }
        }
        this._canMovePieces = valid;
    }

    var x, y;
    //拼圖移動 
    for(var i = 0; i < this.columnpieces; ++i) {
        for(var j = 0; j < this.rowpieces; ++j) {
            this.getMousePosition();
            if ( this._PuzzlePieces[i][j].solved === false && this._canMovePieces === true && TouchInput.isPressed() ) {
                //避免一次移動多個碎塊
                if( this.noPiecesMoving() && 
                this.isInPuzzlePieces( this._PuzzlePieces[i][j], this._MouseX, this._MouseY ) && 
                this.TopLayerPuzzlePieces( this._PuzzlePieces[i][j] ) ) 
                {
                    this._PuzzlePieces[i][j].puzzlepiecesmoving = true;
                    //將碎塊放在最上層
                    this._PuzzlePieces[i][j].z = prioritymax;
                }
                //移動碎塊
                if( this._PuzzlePieces[i][j].puzzlepiecesmoving === true ) {
                    x = this._MouseX - this._puzzlepieceswidth/2;
                    y = this._MouseY - this._puzzlepiecesheight/2;
                    this._PuzzlePieces[i][j].move(x, y);
                }
            }
            else if ( TouchInput.isReleased() ) {
                if( this._PuzzlePieces[i][j].puzzlepiecesmoving === true  && this._PuzzlePieces[i][j].solved === false ) {
                    this._PuzzlePieces[i][j].puzzlepiecesmoving = false;
                    this.RestorePuzzlePiecesLayer( this._PuzzlePieces[i][j] );
                    //確認碎塊是否有拼對位置
                    if( this.isPiecesSolved( this._PuzzlePieces[i][j] ) === true ) {
                        this._PuzzlePieces[i][j].solved = true;
                        this._PuzzlePieces[i][j].puzzlepiecesmoving = false;
                        this._PuzzlePieces[i][j].z = prioritysolved;
                        x = this._puzzlepieceswidth * (this._PuzzlePieces[i][j].piecesId % this.rowpieces) + originoffsetX;
                        y = this._puzzlepiecesheight * Math.floor(this._PuzzlePieces[i][j].piecesId / this.rowpieces) + originoffsetY;
                        this._PuzzlePieces[i][j].move(x, y);
                    }
                }
            }
            else {
                this._PuzzlePieces[i][j].puzzlepiecesmoving = false;
                this.PuzzlePiecesOverflowCheck( this._PuzzlePieces[i][j] );
            }
        }
    }

    //排序碎塊
    this._sortPuzzlePieces();
    this.solved = this.checksolved();
    this._finishbutton.visible = this.solved;
}

//創建場景背景
Scene_Puzzle.prototype.createBackground = function() {
    this._backgroundSprite = new Sprite();
    this._backgroundSprite.z = 1;
    this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
    this.addChild( this._backgroundSprite );
    
    this._puzzlebackgroundSprite = new Sprite();
    this._puzzlebackgroundSprite.move( originoffsetX, originoffsetY);
    this._puzzlebackgroundSprite.z = 2;
    this._puzzlebackgroundSprite.bitmap = ImageManager.loadPicture( this.puzzlebackgroundbitmap );
    this.addChild( this._puzzlebackgroundSprite );
};

//創建按鈕(在update function中更新按鈕狀態)
Scene_Puzzle.prototype.createButton = function() {
    this._resetbutton = new Sprite_Button();
    this._resetbutton.x = originoffsetX + puzzlewidth;
    this._resetbutton.y = 370 + originoffsetY;
    this._resetbutton.z = prioritymax + 1;
    this._resetbutton.setClickHandler( this.initializePuzzlePieces.bind(this) );
    this.addChild( this._resetbutton );
    
    this._giveupbutton = new Sprite_Button();
    this._giveupbutton.x = originoffsetX + puzzlewidth;
    this._giveupbutton.y = 460 + originoffsetY;
    this._giveupbutton.z = prioritymax + 1;
    this._giveupbutton.setClickHandler( this.backtoGame.bind(this) );
    this.addChild( this._giveupbutton );

    this._finishbutton = new Sprite_Button();
    this._finishbutton.x = originoffsetX + puzzlewidth;
    this._finishbutton.y = 280 + originoffsetY;
    this._finishbutton.z = prioritymax + 1;
    this._finishbutton.setClickHandler( this.backtoGame.bind(this) );
    this.addChild( this._finishbutton );
};

//創建拼圖碎塊
Scene_Puzzle.prototype.createPuzzlePieces = function() {
    this._PuzzlePieces = [];
    this._puzzlepieceswidth = puzzlewidth / this.rowpieces;
    this._puzzlepiecesheight = puzzleheight / this.columnpieces;
    this._canMovePieces = true;
    var w = this._puzzlepieceswidth;
    var h = this._puzzlepiecesheight;
    for(var i = 0; i < this.columnpieces; ++i) {
        this._PuzzlePieces[i] = [];
        for(var j = 0; j < this.rowpieces; ++j) {
            this._PuzzlePieces[i][j] = new Sprite();
            this._PuzzlePieces[i][j].bitmap = ImageManager.loadPicture( this.puzzlebitmap );
            this._PuzzlePieces[i][j].setFrame(j*w, i*h, w, h);
            this._PuzzlePieces[i][j].piecesId = i * this.rowpieces + j;
            this.addChild( this._PuzzlePieces[i][j] );
        }
    }
    if($gameVariables._data[puzzle_variable_id] == null) {
        this.initializePuzzlePieces();
    }
    else if($gameVariables._data[puzzle_variable_id][this.puzzleId] == null) {
        this.initializePuzzlePieces();
    }
    else {
        this.restorePuzzlePieces();
    }
}

//初始化拼圖碎塊
Scene_Puzzle.prototype.initializePuzzlePieces = function() {
    var w = this._puzzlepieceswidth;
    var h = this._puzzlepiecesheight;
    var offsetx = originoffsetX + puzzlewidth;
    for(var i = 0; i < this.columnpieces; ++i) {
        for(var j = 0; j < this.rowpieces; ++j) {
            //產生隨機座標
            var x = this.random(offsetx, offsetx + piecesinitrect_x - this._puzzlepieceswidth);
            var y = this.random(originoffsetY, originoffsetY + piecesinitrect_y - this._puzzlepieceswidth);
            this._PuzzlePieces[i][j].move(x, y);
            this._PuzzlePieces[i][j].z = this.random(prioritydefaultmin, prioritydefaultmax);
            this._PuzzlePieces[i][j].solved = false;
            this._PuzzlePieces[i][j].puzzlepiecesmoving = false;
        }
    }
    this.solved = false;
    $gameSwitches._data[puzzle_finish_switch_id + this.puzzleId] = false;
}

//恢復拼圖碎塊
Scene_Puzzle.prototype.restorePuzzlePieces = function() {
    var w = this._puzzlepieceswidth;
    var h = this._puzzlepiecesheight;
    var offsetx = originoffsetX + puzzlewidth;
    for(var i = 0; i < this.columnpieces; ++i) {
        for(var j = 0; j < this.rowpieces; ++j) {
            var tmp = $gameVariables._data[puzzle_variable_id][this.puzzleId][this._PuzzlePieces[i][j].piecesId];
            var x = tmp.x;
            var y = tmp.y;
            this._PuzzlePieces[i][j].move(x, y);
            this._PuzzlePieces[i][j].z = tmp.z;
            this._PuzzlePieces[i][j].solved = tmp.solved;
            this._PuzzlePieces[i][j].puzzlepiecesmoving = false;
        }
    }
    this.solved = $gameSwitches._data[puzzle_finish_switch_id + this.puzzleId];
}

//產生隨機數字
Scene_Puzzle.prototype.random = function(min, max) {
    return Math.floor( Math.random()*(max-min+1)+min );
}

//確認按鈕狀態
Scene_Puzzle.prototype.isButtonHover = function(button) {
    // console.log(TouchInput.nowX);
    // console.log(TouchInput.nowY);
    if(button.x + 15 <= this._MouseX && this._MouseX <= button.x + buttonwidth - 15) {
        if(button.y <= this._MouseY && this._MouseY <= button.y + buttonheight) {
            return true;
        }
    }
    return false;
}

//取得滑鼠位置
Scene_Puzzle.prototype.getMousePosition = function() {  
    this._MouseX = TouchInput.nowX;
    this._MouseY = TouchInput.nowY;
};

//確認是否有其他碎塊正在移動
Scene_Puzzle.prototype.noPiecesMoving = function() {
    for(var i = 0; i < this.columnpieces; ++i) {
        for(var j = 0; j < this.rowpieces; ++j) {
            if( this._PuzzlePieces[i][j].puzzlepiecesmoving === true ) {
                return false;
            }
        }
    }
    return true;
}

//確認某個點是否落在碎塊內
Scene_Puzzle.prototype.isInPuzzlePieces = function(piece, x, y) {
    if(piece.x <= x && x <= piece.x + this._puzzlepieceswidth) {
        if(piece.y <= y && y <= piece.y + this._puzzlepiecesheight) {
            return true;
        }
    }
    return false;
}

//確認碎塊是否在最上層
Scene_Puzzle.prototype.TopLayerPuzzlePieces = function(piece) {
    for(var i = 0; i < this.columnpieces; ++i) {
        for(var j = 0; j < this.rowpieces; ++j) {
            if( i * this.rowpieces + j === piece.piecesId ) {
                continue;
            }
            if( this.isInPuzzlePieces( this._PuzzlePieces[i][j], this._MouseX, this._MouseY ) === true ) {
                if( this._PuzzlePieces[i][j].z > piece.z ) {
                    return false;
                }
            }
        }
    }
    return true;
}

//恢復碎塊的圖層順序
Scene_Puzzle.prototype.RestorePuzzlePiecesLayer = function(piece) {
    var maxz = -1;
    for(var i = 0; i < this.columnpieces; ++i) {
        for(var j = 0; j < this.rowpieces; ++j) {
            if( i * this.rowpieces + j === piece.piecesId ) {
                continue;
            }
            if( this.isPiecesOverlap( piece, this._PuzzlePieces[i][j] ) === true ) {
                maxz = Math.max(maxz, this._PuzzlePieces[i][j].z);
            }
        }
    }
    if(maxz !== -1) {
        piece.z = maxz + 1;
    }
    else {
        piece.z = this.random(prioritydefaultmin, prioritydefaultmax);
    }
};

//檢查碎塊是否重疊
Scene_Puzzle.prototype.isPiecesOverlap = function(piece1, piece2) {
    var w = this._puzzlepieceswidth;
    var h = this._puzzlepiecesheight;
    //左上
    if(piece1.x <= piece2.x && piece1.y <= piece2.y) {
        if( this.isInPuzzlePieces( piece1, piece2.x, piece2.y ) ) {
            return true;
        }
    }
    //右上
    if(piece1.x >= piece2.x && piece1.y <= piece2.y) {
        if( this.isInPuzzlePieces( piece1, piece2.x+w, piece2.y ) ) {
            return true;
        }
    }
    //左下
    if(piece1.x <= piece2.x && piece1.y >= piece2.y) {
        if( this.isInPuzzlePieces( piece1, piece2.x, piece2.y+h ) ) {
            return true;
        }
    }
    //右下
    if(piece1.x >= piece2.x && piece1.y >= piece2.y) {
        if( this.isInPuzzlePieces( piece1, piece2.x+w, piece2.y+h ) ) {
            return true;
        }
    }
    return false;
}

//檢查碎塊是否拚對位置
Scene_Puzzle.prototype.isPiecesSolved = function(piece) {
    var desx = this._puzzlepieceswidth * (piece.piecesId % this.rowpieces) + originoffsetX;
    var desy = this._puzzlepiecesheight * Math.floor(piece.piecesId / this.rowpieces) + originoffsetY;
    var x = piece.x;
    var y = piece.y;
    if( (desx-x)*(desx-x) + (desy-y)*(desy-y) < this.piecesolvemaxgap * this.piecesolvemaxgap ) {
        return true;
    }
    return false;
}

//檢查拼圖是否被移出視窗
Scene_Puzzle.prototype.PuzzlePiecesOverflowCheck = function(piece) {
    var x = piece.x;
    var y = piece.y;
    if(x < 0) {
        x = 0;
    }
    if(x > framewindowWidth - this._puzzlepieceswidth) {
        x = framewindowWidth - this._puzzlepieceswidth;
    }
    if(y < 0) {
        y = 0;
    }
    if(y > framewindowHeight - this._puzzlepiecesheight) {
        y = framewindowHeight - this._puzzlepiecesheight;
    }
    piece.move(x, y);
}

//排序碎塊上下層
Scene_Puzzle.prototype._sortPuzzlePieces = function() {
    this.children.sort( this._comparePiecesOrder.bind(this) );
};

Scene_Puzzle.prototype._comparePiecesOrder = function(a, b) {
    if (a.z !== b.z) {
        return a.z - b.z;
    } 
    else {
        return a.piecesId - b.piecesId;
    }
};

//回到主遊戲
Scene_Puzzle.prototype.backtoGame = function() {
    if($gameVariables._data[puzzle_variable_id] === undefined){
        $gameVariables._data[puzzle_variable_id] = [];
    }
    var tmp = [];
    for(var i = 0; i < this.columnpieces; ++i) {
        for(var j = 0; j < this.rowpieces; ++j) {
            var coordinate = {
                x : this._PuzzlePieces[i][j].x,
                y : this._PuzzlePieces[i][j].y,
                z : this._PuzzlePieces[i][j].z,
                ID : this._PuzzlePieces[i][j].piecesId,
                solved : this._PuzzlePieces[i][j].solved
            }
            tmp.push(coordinate);
        }
    }
    $gameVariables._data[puzzle_variable_id][this.puzzleId] = tmp;
    $gameSwitches._data[puzzle_finish_switch_id + this.puzzleId] = this.checksolved();
    SceneManager.goto( backScene );
}

Scene_Puzzle.prototype.checksolved = function() {
    var tmp = true;
    for(var i = 0; i < this.columnpieces; ++i) {
        for(var j = 0; j < this.rowpieces; ++j) {
            if(!this._PuzzlePieces[i][j].solved) {
                tmp = false;
            }
        }
    }
    return tmp;
}

