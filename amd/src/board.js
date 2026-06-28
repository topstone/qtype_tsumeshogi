// encoding: UTF-8
// qtype_tsumeshogi/amd/src/board.js
// Plain global JS — no AMD build step required.
// Entry point: tsumeshogi_init(slot)
//
// SFEN piece codes (uppercase=sente/black, lowercase=gote/white, +=promoted):
//   K/k=玉  R/r=飛  B/b=角  G/g=金  S/s=銀  N/n=桂  L/l=香  P/p=歩
(function (global) {
    'use strict';

    /* ── layout constants ──────────────────────────────────── */
    var COLS = 9, ROWS = 9, CELL = 46, MARGIN = 28, HAND_W = 76;
    var BW   = CELL * COLS;
    var BH   = CELL * ROWS;
    var SVG_W = MARGIN * 2 + BW + HAND_W * 2;
    var SVG_H = MARGIN * 2 + BH + 20; // +20 for turn label
    var NS    = 'http://www.w3.org/2000/svg';

    /* ── piece → kanji ─────────────────────────────────────── */
    var KANJI = {
        K:'玉', R:'飛', B:'角', G:'金', S:'銀', N:'桂', L:'香', P:'歩',
        '+R':'竜', '+B':'馬', '+S':'全', '+N':'圭', '+L':'杏', '+P':'と'
    };
    function kanji(p) {
        var u = p.toUpperCase();
        if (u.charAt(0) === '+') return KANJI['+' + u.charAt(1)] || u;
        return KANJI[u.charAt(0)] || u;
    }
    // USI col label: index 0 → '9', index 8 → '1'
    function cLbl(c) { return String(COLS - c); }
    // USI row label: index 0 → 'a', index 8 → 'i'
    function rLbl(r) { return String.fromCharCode(97 + r); }

    /* ── SVG helper ────────────────────────────────────────── */
    function mkEl(tag, attrs, txt) {
        var e = document.createElementNS(NS, tag);
        for (var k in attrs) { if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]); }
        if (txt !== undefined) e.textContent = String(txt);
        return e;
    }
    function cellX(c) { return MARGIN + HAND_W + c * CELL; }
    function cellY(r) { return MARGIN + r * CELL; }

    /* ── SFEN parser ───────────────────────────────────────── */
    function parseSFEN(sfen) {
        var parts  = (sfen || '').trim().split(/\s+/);
        var board  = [];
        var r, c;
        for (r = 0; r < ROWS; r++) {
            board.push([]);
            for (c = 0; c < COLS; c++) board[r].push(null);
        }

        // Board ranks
        var rank = parts[0] || '';
        r = 0; c = 0;
        for (var i = 0; i < rank.length; i++) {
            var ch = rank.charAt(i);
            if (ch === '/') { r++; c = 0; }
            else if (/\d/.test(ch)) { c += parseInt(ch, 10); }
            else {
                var piece = '';
                if (ch === '+') { piece = '+'; i++; ch = rank.charAt(i); }
                piece += ch;
                if (r < ROWS && c < COLS) board[r][c] = piece;
                c++;
            }
        }

        // Turn
        var turn = parts[1] || 'b';

        // Hands
        var hands = { b: {}, w: {} };
        var hs = parts[2] || '-';
        if (hs !== '-') {
            var hi = 0;
            while (hi < hs.length) {
                var cnt = '';
                while (hi < hs.length && /\d/.test(hs.charAt(hi))) cnt += hs.charAt(hi++);
                var n  = cnt === '' ? 1 : parseInt(cnt, 10);
                var hp = hs.charAt(hi++);
                if (!hp) break;
                var side = (hp === hp.toUpperCase()) ? 'b' : 'w';
                var key  = hp.toUpperCase();
                hands[side][key] = (hands[side][key] || 0) + n;
            }
        }
        return { board: board, turn: turn, hands: hands };
    }

    /* ── draw board ────────────────────────────────────────── */
    function render(state, svg, slot, inputEl, readonly) {
        // Clear
        while (svg.firstChild) svg.removeChild(svg.firstChild);

        var r, c;

        // Outer bg
        svg.appendChild(mkEl('rect', { x:0, y:0, width:SVG_W, height:SVG_H, fill:'#d4a84b' }));

        // Board bg
        svg.appendChild(mkEl('rect', {
            x: MARGIN + HAND_W, y: MARGIN,
            width: BW, height: BH,
            fill:'#f0d49a', stroke:'#5c3a00', 'stroke-width':2
        }));

        // Grid lines
        for (r = 0; r <= ROWS; r++) {
            var gy = MARGIN + r * CELL;
            svg.appendChild(mkEl('line', {
                x1: MARGIN + HAND_W, y1: gy,
                x2: MARGIN + HAND_W + BW, y2: gy,
                stroke:'#5c3a00', 'stroke-width': r === 0 || r === ROWS ? 2 : 0.7
            }));
        }
        for (c = 0; c <= COLS; c++) {
            var gx = MARGIN + HAND_W + c * CELL;
            svg.appendChild(mkEl('line', {
                x1: gx, y1: MARGIN,
                x2: gx, y2: MARGIN + BH,
                stroke:'#5c3a00', 'stroke-width': c === 0 || c === COLS ? 2 : 0.7
            }));
        }

        // Star points (hoshi)
        [[3,3],[3,6],[6,3],[6,6]].forEach(function(pt) {
            svg.appendChild(mkEl('circle', {
                cx: MARGIN + HAND_W + pt[0] * CELL,
                cy: MARGIN + pt[1] * CELL,
                r: 3, fill:'#5c3a00'
            }));
        });

        // Column numbers (9→1) above board
        for (c = 0; c < COLS; c++) {
            svg.appendChild(mkEl('text', {
                x: cellX(c) + CELL / 2, y: MARGIN - 6,
                'text-anchor':'middle', 'font-size':12,
                'font-family':'sans-serif', fill:'#3a1a00'
            }, cLbl(c)));
        }
        // Row letters (a→i) right of board
        for (r = 0; r < ROWS; r++) {
            svg.appendChild(mkEl('text', {
                x: MARGIN + HAND_W + BW + 6,
                y: cellY(r) + CELL * 0.67,
                'font-size':12, 'font-family':'sans-serif', fill:'#3a1a00'
            }, rLbl(r)));
        }

        // Turn label
        svg.appendChild(mkEl('text', {
            x: SVG_W / 2, y: SVG_H - 4,
            'text-anchor':'middle', 'font-size':13,
            'font-family':'sans-serif',
            fill: state.turn === 'b' ? '#0000cc' : '#cc0000'
        }, state.turn === 'b' ? '▲ 先手番' : '△ 後手番'));

        // Pieces on board
        for (r = 0; r < ROWS; r++) {
            for (c = 0; c < COLS; c++) {
                var p = state.board[r][c];
                if (p) drawBoardPiece(svg, p, c, r, state, slot, inputEl, readonly);
            }
        }

        // Hands
        drawHand(svg, state, 'b', slot, inputEl, readonly);
        drawHand(svg, state, 'w', slot, inputEl, readonly);
    }

    /* ── draw one board piece ──────────────────────────────── */
    function drawBoardPiece(svg, piece, col, row, state, slot, inputEl, readonly) {
        var isGote   = (piece !== piece.toUpperCase());
        var promoted = (piece.charAt(0) === '+');
        var x = cellX(col), y = cellY(row);

        var g = mkEl('g', {
            transform: 'translate(' + x + ',' + y + ')' +
                (isGote ? ' rotate(180,' + (CELL/2) + ',' + (CELL/2) + ')' : ''),
            style: readonly ? 'cursor:default' : 'cursor:grab'
        });

        // Pentagon body
        var pw = CELL - 6, ph = CELL - 4, ox = 3, oy = 4, hw = pw / 2;
        var pts = (ox+hw)+','+(oy)+' '+(ox+pw)+','+(oy+10)+' '+
                  (ox+pw)+','+(oy+ph)+' '+ox+','+(oy+ph)+' '+ox+','+(oy+10);
        g.appendChild(mkEl('polygon', {
            points: pts,
            fill: '#fffbe6',
            stroke: promoted ? '#aa0000' : '#5c3a00',
            'stroke-width': promoted ? 2 : 1
        }));
        g.appendChild(mkEl('text', {
            x: CELL/2, y: CELL * 0.72,
            'text-anchor':'middle', 'font-size':17,
            'font-family':'serif',
            fill: promoted ? '#aa0000' : '#000'
        }, kanji(piece)));

        if (!readonly) attachBoardDrag(g, svg, col, row, piece, state, slot, inputEl);
        svg.appendChild(g);
    }

    /* ── draw hand panel ───────────────────────────────────── */
    function drawHand(svg, state, side, slot, inputEl, readonly) {
        var hand    = state.hands[side];
        var isGote  = (side === 'w');
        var panelX  = isGote ? MARGIN + HAND_W + BW + 18 : 4;
        var label   = isGote ? '後手持駒' : '先手持駒';
        var bgColor = isGote ? '#dce8ff' : '#fff8dc';

        svg.appendChild(mkEl('rect', {
            x: panelX - 2, y: MARGIN - 2,
            width: HAND_W - 4, height: BH + 4,
            fill: bgColor, stroke:'#999', 'stroke-width':1, rx:4
        }));
        svg.appendChild(mkEl('text', {
            x: panelX + (HAND_W-4)/2, y: MARGIN + 12,
            'text-anchor':'middle', 'font-size':10,
            'font-family':'sans-serif', fill:'#555'
        }, label));

        var pieces = Object.keys(hand).filter(function(k) { return hand[k] > 0; });
        pieces.forEach(function(p, idx) {
            var yOff  = MARGIN + 18 + idx * (CELL + 4);
            var piece = isGote ? p.toLowerCase() : p;

            var g = mkEl('g', {
                transform: 'translate(' + panelX + ',' + yOff + ')',
                style: readonly ? 'cursor:default' : 'cursor:grab'
            });
            g.appendChild(mkEl('rect', {
                x:2, y:2, width:CELL-2, height:CELL-2,
                fill:'#fffbe6', stroke:'#7b5900', 'stroke-width':1, rx:3
            }));
            g.appendChild(mkEl('text', {
                x: CELL/2, y: CELL*0.68,
                'text-anchor':'middle', 'font-size':16,
                'font-family':'serif', fill:'#000'
            }, kanji(piece)));
            g.appendChild(mkEl('text', {
                x: CELL - 4, y: CELL - 3,
                'text-anchor':'end', 'font-size':10,
                'font-family':'sans-serif', fill:'#555'
            }, String(hand[p])));

            if (!readonly) attachHandDrag(g, svg, side, p, state, slot, inputEl);
            svg.appendChild(g);
        });
    }

    /* ── drag & drop ───────────────────────────────────────── */
    var drag = null;

    function svgPt(svg, e) {
        var vbParts = (svg.getAttribute('viewBox') || '0 0 500 500').split(' ');
        var rc  = svg.getBoundingClientRect();
        var sx  = parseFloat(vbParts[2]) / rc.width;
        var sy  = parseFloat(vbParts[3]) / rc.height;
        var src = e.touches ? e.touches[0] : (e.changedTouches ? e.changedTouches[0] : e);
        return { x: (src.clientX - rc.left) * sx, y: (src.clientY - rc.top) * sy };
    }

    function startDrag(e, svg, info) {
        e.preventDefault();
        e.stopPropagation();
        var pt    = svgPt(svg, e);
        var ghost = mkEl('text', {
            x: pt.x, y: pt.y,
            'text-anchor':'middle', 'font-size':30,
            fill:'rgba(0,0,0,0.35)', 'pointer-events':'none'
        }, kanji(info.piece));
        svg.appendChild(ghost);
        drag = { info:info, svg:svg, ghost:ghost };

        document.addEventListener('mousemove', onMove, true);
        document.addEventListener('mouseup',   onEnd,  true);
        document.addEventListener('touchmove', onMove, { capture:true, passive:false });
        document.addEventListener('touchend',  onEnd,  true);
    }

    function onMove(e) {
        if (!drag) return;
        if (e.cancelable) e.preventDefault();
        var pt = svgPt(drag.svg, e);
        drag.ghost.setAttribute('x', pt.x);
        drag.ghost.setAttribute('y', pt.y);
    }

    function onEnd(e) {
        if (!drag) return;
        document.removeEventListener('mousemove', onMove, true);
        document.removeEventListener('mouseup',   onEnd,  true);
        document.removeEventListener('touchmove', onMove, true);
        document.removeEventListener('touchend',  onEnd,  true);

        var pt = svgPt(drag.svg, e);
        if (drag.ghost.parentNode) drag.ghost.parentNode.removeChild(drag.ghost);

        var toCol = Math.floor((pt.x - MARGIN - HAND_W) / CELL);
        var toRow = Math.floor((pt.y - MARGIN)           / CELL);

        if (toCol >= 0 && toCol < COLS && toRow >= 0 && toRow < ROWS) {
            applyMove(drag.info, toCol, toRow, drag.svg);
        }
        drag = null;
    }

    function attachBoardDrag(g, svg, col, row, piece, state, slot, inputEl) {
        var info = { type:'board', col:col, row:row, piece:piece,
                     state:state, slot:slot, inputEl:inputEl };
        g.addEventListener('mousedown',  function(e) { startDrag(e, svg, info); });
        g.addEventListener('touchstart', function(e) { startDrag(e, svg, info); }, { passive:false });
    }

    function attachHandDrag(g, svg, side, piece, state, slot, inputEl) {
        var info = { type:'hand', side:side, piece:piece,
                     state:state, slot:slot, inputEl:inputEl };
        g.addEventListener('mousedown',  function(e) { startDrag(e, svg, info); });
        g.addEventListener('touchstart', function(e) { startDrag(e, svg, info); }, { passive:false });
    }

    /* ── apply move & re-render ────────────────────────────── */
    function applyMove(info, toCol, toRow, svg) {
        var usi;
        var state   = info.state;
        var slot    = info.slot;
        var inputEl = info.inputEl;
        var piece   = info.piece;

        if (info.type === 'hand') {
            // Drop from hand
            usi = piece.toUpperCase() + '*' + cLbl(toCol) + rLbl(toRow);
            var cnt = state.hands[info.side][piece];
            if (cnt <= 1) { delete state.hands[info.side][piece]; }
            else          { state.hands[info.side][piece] = cnt - 1; }
            state.board[toRow][toCol] = (info.side === 'b') ? piece : piece.toLowerCase();

        } else {
            // Board move
            var fromCol = info.col, fromRow = info.row;
            if (fromCol === toCol && fromRow === toRow) return;

            var base      = cLbl(fromCol) + rLbl(fromRow) + cLbl(toCol) + rLbl(toRow);
            var isBlack   = (piece === piece.toUpperCase());
            var promoted  = (piece.charAt(0) === '+');
            var baseUpper = piece.toUpperCase().replace('+', '');
            var canProm   = !promoted && baseUpper !== 'K' && baseUpper !== 'G';
            var inZone    = isBlack ? toRow <= 2 : toRow >= 6;
            var doPromote = false;
            if (canProm && inZone && window.confirm('成りますか？')) doPromote = true;
            usi = base + (doPromote ? '+' : '');

            // Capture — return captured piece (base, unpromoted) to capturing side's hand
            var captured = state.board[toRow][toCol];
            if (captured) {
                var capBase = captured.toUpperCase().replace('+', '');
                var capSide = isBlack ? 'b' : 'w';
                state.hands[capSide][capBase] = (state.hands[capSide][capBase] || 0) + 1;
            }

            state.board[toRow][toCol]   = doPromote ? ('+' + piece) : piece;
            state.board[fromRow][fromCol] = null;
        }

        // Flip turn
        state.turn = (state.turn === 'b') ? 'w' : 'b';

        // Write USI move to hidden input
        inputEl.value = usi;

        // Show move badge
        showBadge(slot, usi);

        // Re-render board
        render(state, svg, slot, inputEl, false);
    }

    function showBadge(slot, move) {
        var id    = 'tsume-badge-' + slot;
        var badge = document.getElementById(id);
        if (!badge) {
            badge = document.createElement('div');
            badge.id = id;
            badge.style.cssText = 'margin-top:6px;font-size:14px;font-weight:bold;color:#1a6900;';
            var boardDiv = document.getElementById('shogi-board-' + slot);
            if (boardDiv && boardDiv.parentNode) {
                boardDiv.parentNode.insertBefore(badge, boardDiv.nextSibling);
            }
        }
        badge.textContent = '\u25b6 \u9078\u629e\u3057\u305f\u624b: ' + move;
    }

    /* ── public entry point ────────────────────────────────── */
    global.tsumeshogi_init = function(slot) {
        function doInit() {
            var boardDiv = document.getElementById('shogi-board-' + slot);
            if (!boardDiv) {
                // DOM not ready yet — retry once after a short delay
                setTimeout(doInit, 100);
                return;
            }

            var sfen     = boardDiv.getAttribute('data-sfen');
            var inputId  = boardDiv.getAttribute('data-input');
            var readonly = boardDiv.getAttribute('data-readonly') === 'true';
            var inputEl  = document.getElementById(inputId);

            if (!sfen || !inputEl) {
                setTimeout(doInit, 100);
                return;
            }

            // Prevent double-init
            if (boardDiv.getAttribute('data-initialized')) return;
            boardDiv.setAttribute('data-initialized', '1');

            var state = parseSFEN(sfen);
            var svg   = mkEl('svg', {
                viewBox: '0 0 ' + SVG_W + ' ' + SVG_H,
                style: 'width:100%;max-width:' + SVG_W + 'px;display:block;' +
                       'touch-action:none;user-select:none;-webkit-user-select:none;'
            });
            boardDiv.appendChild(svg);
            render(state, svg, slot, inputEl, readonly);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', doInit);
        } else {
            doInit();
        }
    };

}(window));
