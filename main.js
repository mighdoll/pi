import xorshift from 'xorshift';
import d3 from 'd3';
import Big from 'big.js';
import 'material-design-lite';

Big.DP = 200;
var accuracyReport = 100;
var referencePi = Big(
    '3.141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117067982148086513282306647093844609550582231725359408128481117450284102701938521105559644622948954930381964428810975665933446128475648233786783165271201909145648566923460348610454326648213393607260249141273724587006606315588174881520920962829254091715364367892590360011330530548820466521384146951941511609433057270365759591953092186117381932611793105118548074462379962749567351885752724891227938183011949129833673362440656643086021394946395224737190702179860943702770539217176293176752384674818467669405132000568127145263560827785771342757789609173637178721468440901224953430146549585371050792279689258923542019956112129021960864034418159813629774771309960518707211349999998372978049951059731732816096318595024459455346908302642522308253344685035261931188171010003137838752886587533208381420617177669147303598253490428755468731159562863882353787593751957781857780532171226806613001927876611195909216420198938');

bindUI();

MathJax.Hub.Config({
    extensions: ["asciimath2jax.js", "MathEvents.js", "MathZoom.js", "MathMenu.js", "toMathML.js", "fast-preview.js", "AssistiveMML.js"],
    jax: ["input/AsciiMath", "output/CommonHTML", "output/PreviewHTML"]
});
MathJax.Ajax.loadComplete("[MathJax]/config/AM_CHTML.js");

/** attatch actions to the main UI buttons */
function bindUI() {
    var random = randomPi();
    var nila = nilakantha();
    archimedes(d$('#archimedes'));

    d$('#random-show').on('click', random);
    d$('#nilakantha').on('click', nila);
}

/** d$ is an alias for d3.select */
function d$() {
    return d3.select.apply(this, arguments);
}


/** setup demo for pi by counting random points that fall in an inscribed circle */
function randomPi() {
    var box = d$('#random-simulation'),
        pointsInput = d$('#random-points'),
        width = 400,
        height = 400,
        inCircle = 0,
        total = 0;

    d$('#random-go').on('click', go);
    pointsInput.on('keypress', function() {
        if (d3.event.keyCode == 13) {
            go();
        }
    });

    /** clear the display and reset the pi calculation */
    function clear() {
        inCircle = 0;
        total = 0;
        box.selectAll('.point').remove();
        d$('#random-in-circle').text("");
        d$('#random-total').text("");
        d$('#random-estimate').text("");
        d$('#random-accuracy').text("");
    }

    /** estimate pi based on the number of points within the circle vs the total points in the box */
    function estimatePi() {
        // area of circle should be pi * r^2. r=1, so area = pi
        // area of box should be 4 (2*2)
        // circle/box = pi/4
        // pi = (4*circle)/box
        var fractionIn = inCircle / total,
            pi = 4 * fractionIn;

        return pi;
    }

    /** update the display after adding the latest point */
    function updateScreen(x, y, inside) {
        var color = inside ? "darkgreen" : "grey",
            computedPi = estimatePi(),
            bigPi = Big(computedPi),
            diff = referencePi.minus(bigPi).abs(),
            accuRatio = diff.div(referencePi),
            accuracy = Big(1).minus(accuRatio).times(100);

        box.append("circle")
            .classed('point', true)
            .attr("cx", width / 2 + x * width / 2)
            .attr("cy", height / 2 - y * height / 2)
            .attr("r", 5)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 1.5);

        d$('#random-in-circle').text(inCircle);
        d$('#random-total').text(total);
        d$('#random-estimate').text(computedPi);
        d$('#random-accuracy').text(accuracy.toFixed(5).toString());
    }

    /** return a number in the range [-1, 1) */
    function randomInBox() {
        return xorshift.random() * 2 - 1;
    }

    /** add more random points and update the pi estimate */
    function go() {
        var tries = pointsInput.node().value || 1;
        for (var i = 0; i < tries; i++) {
            // generate points in the box -1,1
            var x = randomInBox(),
                y = randomInBox(),
                distanceSq = x * x + y * y,
                inside = false;

            // if distance to origin < 1, inside the circle
            if (distanceSq < 1) {
                inside = true;
                inCircle++;
            }
            total++;

            updateScreen(x, y, inside);
        }
    }

    return showHide(d$('#random-card'), clear);
};

/** return a function that toggle the display of an html div.
 * The div appearance/disappearance is animated.
 * @param goneFn is called when the div disappear animation completes */
function showHide(div, goneFn) {
    return function() {
        if (div.style('display') != 'block') {
            div.style('display', 'block')
                .style('max-height', '0px')
                .style('overflow', 'hidden');

            div.transition()
                .duration(750)
                .style('max-height', '750px');

        } else {
            div.transition()
                .duration(750)
                .style('max-height', '0px')
                .transition()
                .style('display', 'none')
                .each('start', function() {
                    goneFn && goneFn();
                });
        }
    }
}


/** setup a demo calculation of pi based on the Nilakantha infinite series */
function nilakantha() {
    var termsInput = d$('#nilakantha-terms'),
        terms,
        estimatedPi;

    clear();

    d$('#nilakantha-go').on('click', go);
    termsInput.on('keypress', function() {
        if (d3.event.keyCode == 13) {
            go();
        }
    });

    /** add more series terms and update the estimate of pi */
    function go() {
        var newTerms = termsInput.node().value || 1;
        for (var i = 0; i < newTerms; i++) {
            var term = ++terms,
                sign = Big(term & 0x1 ? -1 : 1),
                base = ((term - 1) * 2), // 2,4,6,8
                denominator = Big(base).times(Big(base + 1)).times(Big(base + 2)),
                unsigned = Big(4).div(denominator),
                termValue = sign.times(unsigned);

            estimatedPi = estimatedPi.plus(termValue);
        }

        updateScreen();
    }

    function clear() {
        terms = 1;
        termsInput.node().value = 1;
        estimatedPi = Big(3);
        updateScreen();
    }

    /** refresh the screen */
    function updateScreen() {
        d$('#nilakantha-total-terms').text(terms);
        d$('#nilakantha-estimate').text(estimatedPi);
        d$('#nilakantha-accuracy').text(accuracyText(estimatedPi));
    }

    return showHide(d$('#nilakantha-card'), clear);
}

function accuracyText(estimatedPi) {
    var diff = referencePi.minus(estimatedPi).abs(),
        accuRatio = diff.div(referencePi),
        accuracy = Big(1).minus(accuRatio).times(100),
        text = accuracy.toFixed(accuracyReport - 2).toString() + ' %';

    return text;
}

function archimedes(div) {
    var radius = Big(1),
        terms,
        numSides,
        side,
        estimatedPi,
        addTerms = div.select('input.add-terms');

    setup();

    function clear() {
        terms = 1;
        numSides = Big(6);
        side = Big(1);
        estimatePi();
        updateScreen();
    }

    function setup() {
        clear();

        var toggleDisplay = showHide(div.select(".section-body"), clear);
        div.select('.section-button').on('click', toggleDisplay);
        div.select('button.reset').on('click', clear);
        div.select('button.go').on('click', showNextPolygon);
        inputAction(addTerms, showNextPolygon);
    }

    function nextPolygon() {
        var halfSide = side.div(2),
            halfSideSquared = halfSide.times(halfSide),
            c = radius.times(radius).minus(halfSideSquared).sqrt(),
            b = radius.minus(c),
            newSide = b.times(b).plus(halfSideSquared).sqrt();

        side = newSide;
        numSides = numSides.times(2);
        terms++;
    }

    function showNextPolygon() {
        var add = addTerms.node().value || 1;

        while (add--) {
            nextPolygon();
        }
        estimatePi();
        updateScreen();
    }

    function estimatePi() {
        var perimeter = numSides.times(side),
            diameter = radius.times(2);

        estimatedPi = perimeter.div(diameter);
    }

    function updateScreen() {
        var accurate = accuracyText(estimatedPi);
        div.select('.terms').text(terms);
        div.select('.polygon-sides').text(numSides);
        div.select('.estimate').text(estimatedPi.toFixed(accuracyReport));
        div.select('.accuracy').text(accurate);
    }

    function diagram() {
        var svg = div.select("g.diagram");
        svg.append('circle')
            .attr('cx', 200)
            .attr('cy', 200);
    }
}

/** trigger a function when the user presses return on an input field */
function inputAction(input, action) {
    input.on('keypress', function() {
        if (d3.event.keyCode == 13) {
            action();
        }
    });
}
