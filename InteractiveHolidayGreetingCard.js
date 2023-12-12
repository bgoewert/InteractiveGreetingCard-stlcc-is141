'use strict';

if ( typeof $ === 'undefined' ) {
    var $ = selector => selector.includes( '#' ) ? document.querySelector( selector ) : document.querySelectorAll( selector );
}

let cursor = {
    x: 0,
    y: 0,
    object: null
};

let end,
    background,
    tree,
    star,
    card,
    baubles = [],
    baubleCount = 5,
    baublesOnTree = false,
    starOnTree = false;


class Picture {
    image = new Image();
    loaded = false;

    constructor ( context, x, y, source, width = 0, height = 0 ) {
        this.context = context;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.source = source;
        this.image.src = this.source;

        this.image.addEventListener( 'load', () => {

            // If the width or height is 0, then set it to the image's width or height with the appropriate aspect ratio.
            if ( this.width > 0 || this.height > 0 ) {

                // Try calculating the aspect ratio based on both the width and height.
                let ratio = Math.min( this.width / this.image.width, this.height / this.image.height );

                // If the ratio is 0, then try calculating the aspect ratio based on the width or the height.
                if ( ratio == 0 ) {
                    if ( this.width > 0 ) {
                        ratio = this.width / this.image.width;
                    } else if ( this.height > 0 ) {
                        ratio = this.height / this.image.height;
                    }
                }

                this.width = this.image.width * ratio;
                this.height = this.image.height * ratio;
            } else {
                this.width = this.image.width;
                this.height = this.image.height;
            }

            this.loaded = true;
        } );
    }

    draw() {
        if ( this.loaded ) {
            this.context.drawImage( this.image, this.x, this.y, this.width, this.height );
        }
    }
}

class Bauble extends Picture {

    constructor ( context, x, y, width = 20 ) {
        let colors = [
            'red',
            'blue',
            'gold'
        ];

        let sources = [
            'images/Christmas Bauble Red.png',
            'images/Christmas Bauble Blue.png',
            'images/Christmas Bauble Gold.png'
        ];

        let randomColor = colors[ Math.floor( Math.random() * colors.length ) ];

        super( context, x, y, sources[ colors.indexOf( randomColor ) ], width );
        this.color = randomColor;
    }
}

/**
 * Wraps text onto an HTML canvas of fixed width.
 * 
 * Adapted from: https://fjolt.com/article/html-canvas-how-to-wrap-text
 * Credits to the author.
 * 
 * @param {object} context Canvas context.
 * @param {string} text Text to wrap.
 * @param {number} lineX X coordinate of the start of the line.
 * @param {number} lineY Y coordinate of the start of the line.
 * @param {number} fontSize Font size. Used to calculate line height.
 * @param {number} maxWidth Max width of the line.
 * @returns {array} Array of lines.
 */
function wrapText( context, text, x, y, fontSize, maxWidth ) {
    let words = text.split( ' ' );
    let line = ''; // This will store the text of the current line.
    let testLine = ''; // This will store the text when we add a word, to test if it's too long.
    let lineArray = [];

    // Ensure that the x and y are integers.
    x = parseInt( x );
    y = parseInt( y );

    // Parse line coords.

    for ( var i = 0; i < words.length; i++ ) {
        // Create a test line, and measure it.
        testLine += `${ words[ i ] } `;
        // If the width of this test line is more than the max width.
        if ( context.measureText( testLine ).width > maxWidth && i > 0 ) {
            // Then the line is finished, push the current line into "lineArray".
            lineArray.push( [ line, x, y ] );
            // Increase the line height, so a new line is started.
            y += parseInt( fontSize );
            // Update line and testLine to use this word as the first word on the next line.
            line = `${ words[ i ] } `;
            testLine = `${ words[ i ] } `;
        }
        else {
            // If the test line is still less than the max width, then add the word to the current line.
            line += `${ words[ i ] } `;
        }
        // If we never reach the full max width, then there is only one line.. so push it into the lineArray so we return something.
        if ( i === words.length - 1 ) {
            lineArray.push( [ line, x, y ] );
        }
    }

    return lineArray;
}

document.addEventListener( 'DOMContentLoaded', () => {

    const canvas = $( 'canvas' )[ 0 ];
    const context = canvas.getContext( '2d' );

    // Get cursor position
    document.addEventListener( 'mousemove', event => {
        cursor.x = event.clientX;
        cursor.y = event.clientY;
    } );

    background = new Picture( context, 0, 0, 'images/Empty Living Room.jpg' );

    // Create the tree
    tree = new Picture( context, 30, 0, 'images/Christmas Tree.png', 180 );
    tree.image.addEventListener( 'load', () => {
        tree.y = canvas.height - tree.image.height + 30;
    } );

    // Create 5 random colored bauble ornaments
    let baubleX = canvas.width / 2; // - ( ( baubleCount * 30 ) / 2 );
    let baubleY = canvas.height / 1.333;
    for ( let i = 0; i < baubleCount; i++ ) {
        baubles.push( new Bauble( context, baubleX, baubleY, 30 ) );
        baubleX += baubles[ i ].width * 1.5;
    }

    // Create the Christmas tree star
    star = new Picture( context, canvas.width / 1.5, canvas.height / 2, 'images/Christmas Star.png', 60 );

    // Create the Christmas card
    card = new Picture( context, 0, 0, 'images/Christmas Card.jpg', canvas.width );

    // Draw directions
    context.font = 'Bold 24px Arial';
    context.fillStyle = '#003300';
    let headingX = 40;
    let headingLines = wrapText( context, 'Decorate the tree to get a gift! Once you are complete, press the END key.', 40, 40, 24, canvas.width - 80 );
    let animateHeadingStartX = -canvas.width;

    function drawObjects() {

        // Check if all the baubles are on the tree
        if ( baubles !== null && baubles.every( bauble => bauble.x >= tree.x && bauble.x <= tree.x + tree.width && bauble.y >= tree.y && bauble.y <= tree.y + tree.height ) ) {
            baublesOnTree = true;
        } else {
            baublesOnTree = false;
        }

        // Check if the star is on top of the tree
        let starOnTop = (
            star !== null && tree !== null &&
            star.x >= tree.x + tree.width / 4 &&
            star.x <= tree.x + tree.width / 3 &&
            star.y >= tree.y - star.image.height / 1.333 &&
            star.y <= tree.y - star.image.height / 3
        );
        // console.log( starOnTop );
        if ( starOnTop ) {
            starOnTree = true;
        } else {
            starOnTree = false;
        }

        // context.save();
        context.clearRect( 0, 0, canvas.width, canvas.height );
        // canvas.width = canvas.width;

        if ( baublesOnTree && starOnTree && end ) {
            // window.alert( 'Merry Christmas!' );

            // Draw Christmas card image
            card.draw();

            baubles.forEach( b => b.loaded = false );
            tree.loaded = false;
            star.loaded = false;
        } else {
            // Draw background
            background.draw();

            // Draw the tree first
            tree.draw();

            // Draw the baubles
            baubles.forEach( bauble => bauble.draw() );

            // Draw the star
            star.draw();

            // Draw directions
            if ( animateHeadingStartX < headingX ) animateHeadingStartX += 10;
            headingLines.forEach( line => context.fillText( line[ 0 ], animateHeadingStartX, line[ 2 ] ) );
            // console.log( headingLines );

        }

        // context.restore();
        // window.requestAnimationFrame( drawObjects );

        // Limit FPS
        setTimeout( () => { window.requestAnimationFrame( drawObjects ); },
            1000 / 30
        );
    }

    drawObjects();

    // Object selected
    canvas.addEventListener( 'mousedown', event => {

        cursor.object = null;

        if ( baubles == null && tree == null && star == null && end ) {
            return;
        }

        // Check if a bauble was selected
        baubles.forEach( bauble => {
            if ( cursor.x >= bauble.x && cursor.x <= bauble.x + bauble.width && cursor.y >= bauble.y && cursor.y <= bauble.y + bauble.height ) {
                cursor.object = bauble;
            }
        } );

        // Check if the star was selected
        if ( cursor.x >= star.x && cursor.x <= star.x + star.width && cursor.y >= star.y && cursor.y <= star.y + star.height ) {
            cursor.object = star;
        }
    } );

    // Object released
    canvas.addEventListener( 'mouseup', event => {
        cursor.object = null;
    } );

    // Object moved
    canvas.addEventListener( 'mousemove', event => {
        if ( cursor.object ) {
            cursor.object.x = cursor.x - ( cursor.object.width / 1.3333 );
            cursor.object.y = cursor.y - ( cursor.object.height / 1.3333 );
        }
    } );

    // Check if end is pressed
    document.addEventListener( 'keydown', event => {
        if ( event.key === 'End' ) {
            // prevent the default action (scroll / move caret)
            event.preventDefault();
            if ( baublesOnTree && starOnTree ) {
                end = true;
            } else {
                end = false;
                window.alert( 'You must complete the tree before you can get your gift!' );
            }
        }
    } );
} );
