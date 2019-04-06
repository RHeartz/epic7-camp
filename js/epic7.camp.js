var heroes = null;
var campHeroes = null;
var campOptions = null;

$(document).ready(function() {
	$.getJSON("./json/epic7camp-minified-20190406.json", function(data) {
		heroes = data.heroes;
		campHeroes = data.campHeroes;
		campOptions = data.campOptions;

		configureDrpCampHeroSelection();
	});

	$("#divContainerCampInfoCombination").hide();
	$("#divContainerCampInfoWarning").hide();
	$("#divContainerCampResultLoading").hide();
	$("#btnCampSubmit").prop("disabled", true);

	$("#btnCampSubmit").click(function(e) {
		$("#divContainerCampResultTable").empty();
		$("#divContainerCampResultLoading").show();
		getCampResult();
	});
});

function generateDrpCampHeroSelectionHtml() {
	var rarity = -1;
	var html = "";

	for (var i = 0; i < heroes.length; i++) {
		if (heroes[i].rarity !== rarity) {
			if (rarity !== -1) {
				html += "</optgroup>";
			}

			rarity = heroes[i].rarity;
			html += "<optgroup label='" + rarity + " Star Heroes'>";
		}

		html += "<option value='" + heroes[i].id + "'>" + heroes[i].name + "</option>";
	}

	html += "</optgroup>";
	return html;
}

function configureDrpCampHeroSelection() {
	$("#drpCampHeroSelection").html(generateDrpCampHeroSelectionHtml());

	$("#drpCampHeroSelection").change(function(e) {
		var count = $(this).val().length;

		if (count < 2) {
			$("#btnCampSubmit").prop("disabled", true);
			$("#divContainerCampInfoCombination").hide();
			$("#divContainerCampInfoWarning").hide();
		} else {
			$("#btnCampSubmit").prop("disabled", false);

			$("#lblCampCombination").html(calcCombination(count, 4));
			$("#divContainerCampInfoCombination").show();

			if (count > 8) {
				$("#divContainerCampInfoWarning").show();
			} else {
				$("#divContainerCampInfoWarning").hide();
			}
		}
	});


	setTimeout(function() {
		$("#drpCampHeroSelection").select2();
	}, 100);
}


function getCampResult() {
	var selectedHeroes = $("#drpCampHeroSelection").val();
	var teams = teamCombinationBuilder(selectedHeroes);
	var result = [];

	for (var i = 0; i < teams.length; i++) {
		var team = teams[i];
		var biggestTwoMorale = [];
		var teamHeroes = [];

		for (var a = 0; a < team.length; a++) {
			var heroId = team[a];
			var hero = campHeroes[heroId];
            teamHeroes[a] = hero.name;

			for (var b = 0; b < hero.campOptions.length; b++) {
				var heroCampOptionId = hero.campOptions[b];
				var currentMorale = 0;

				for (var c = 0; c < team.length; c++) {
					if (c !== a) {
						var otherHeroId = team[c];
						var otherHero = campHeroes[otherHeroId];
						var heroReaction = otherHero.campReactions[heroCampOptionId];

						if (heroReaction !== null)	{
							currentMorale += heroReaction;
						}                      
					}
				}

				if (typeof biggestTwoMorale[0] === "undefined" || (typeof biggestTwoMorale[0] !== "undefined" && biggestTwoMorale[0].morale < currentMorale)) {
					if (typeof biggestTwoMorale[0] !== "undefined") {
						biggestTwoMorale[1] = biggestTwoMorale[0];
					}

					var newBiggestMorale = {
						"campOption" : "<span class='text-danger'>" + hero.name + "</span> - " + campOptions[heroCampOptionId] + " (" + currentMorale + ")",
						"morale" : currentMorale,
					};

					biggestTwoMorale[0] = newBiggestMorale;
				}

				else if (typeof biggestTwoMorale[1] === "undefined" || (typeof biggestTwoMorale[1] !== "undefined" && biggestTwoMorale[1].morale < currentMorale)) {
					var newBiggestMorale = {
						"campOption" : "<span class='text-danger'>" + hero.name + "</span> - " + campOptions[heroCampOptionId] + " (" + currentMorale + ")",
						"morale" : currentMorale,
					};

					biggestTwoMorale[1] = newBiggestMorale;
				}
			}
		}

		var teamResult = {
			"heroes" : teamHeroes,
			"options" : [ biggestTwoMorale[0].campOption, biggestTwoMorale[1].campOption ],
			"morale" : biggestTwoMorale[0].morale + biggestTwoMorale[1].morale,
		};

		result[result.length] = teamResult;
	}

	var orderedResult = result.sort(function(a, b) {
		return b.morale - a.morale;
	});

	$("#divContainerCampResultTable").html(generateCampResultHtml(orderedResult));
    $("#divContainerCampResultLoading").hide();
    $("#divContainerCampResultTable").show();

    $("#tblCampResult").DataTable({
        info: false,
        searching: false,
        ordering: false,
        lengthChange: false,
        pageLength: 5,
    });
}


function generateCampResultHtml(result) {
	var html = "";

	html += "<div class='col-md-12' id='divCampResult'>";
	html +=	"	<table id='tblCampResult' class='table table-striped table-bordered'>";
	html +=	"		<thead>";
	html += "			<tr>";
	html += "				<th>Team</th>";
	html += "				<th>Best Camp Options</th>";
	html += "				<th>Morale</th>";
	html += "			</tr>";
	html += "		</thead>";

	html += "		<tbody>";

	for (var i = 0; i < result.length; i++) {
		html += "		<tr>";
		html += "			<td>" + result[i].heroes.join(", ") + "</td>";
		html += " 			<td>" + result[i].options.join(", ") + "</td>";
		html += "			<td>" + result[i].morale + "</td>";
		html += "		</tr>";
	}

	html += "		</tbody>";
	html += "	</table>";
	html += "</div>";

	return html;
}


function teamCombinationBuilder(heroes) {
	if (heroes.length <= 4)	{
		return [ heroes ];
	}

	var indexCombinations = indexCombinationBuilder(heroes.length);
	var result = [];

	for (var i = 0; i < indexCombinations.length; i++) {
		result[i] = [ heroes[indexCombinations[i][0]], 
			          heroes[indexCombinations[i][1]], 
			          heroes[indexCombinations[i][2]], 
			          heroes[indexCombinations[i][3]] ];
	}

	return result;
}


function indexCombinationBuilder(length) {
	var result = [];

	for (var a = 0; a < length - 3; a++) {
		for (var b = a + 1; b < length - 2; b++) {
			for (var c = b + 1; c < length - 1; c++) {
				for (var d = c + 1; d < length; d++) {
					result[result.length] = [ a, b, c, d ];
				}
			}
		}
	}

	return result;
}