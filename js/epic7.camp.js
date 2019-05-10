var heroes = null;
var campHeroes = null;
var campOptions = null;
var orderedResult = null;
var jsonVersion = "20190510";

$(document).ready(function() {
	$.getJSON("./json/epic7camp-minified-" + jsonVersion + ".json", function(data) {
		heroes = data.heroes;
		campHeroes = data.campHeroes;
		campOptions = data.campOptions;

		configureDrpCampHeroSelection();
	});

	$("#divContainerCampInfoCombination").hide();
	$("#divContainerCampInfoWarning").hide();
	$("#divContainerCampResultLoading").hide();
	$("#lblCampSelectedHero").hide();
	$("#btnCampSubmit").prop("disabled", true);
	$("#btnCampSavePdf").prop("disabled", true);


	$("#btnCampSubmit").click(function(e) {
		$("#divContainerCampResultTable").empty();
		$("#divContainerCampResultLoading").show();

		setTimeout(function() {
			getCampResult();
		}, 100);
	});


	$("#btnCampSavePdf").click(function(e) {
		saveResultToPdf();
	});


	$(document).on('click', '.select2-selection__choice', function(e) {
		if ($(this).hasClass("locked")) {
			$(this).removeClass("locked");
			$(this).children("span.fa-lock").remove();
			configureCampHeroInfoLockedHeroes();
		} else {
			if ($("li.select2-selection__choice.locked").length < 3) {
				$(this).addClass("locked");
				$(this).append("<span class='fa fa-lock'></span>")
				configureCampHeroInfoLockedHeroes();
			}
		}
	});

	
	$("#drpCampHeroSelection").change(function(e) {
		var locked = $("li.select2-selection__choice.locked");

		setTimeout(function() {
			for (var i = 0; i < locked.length; i++) {
				var title = $(locked[i]).attr("title");
				var selector = "li.select2-selection__choice[title='" + title + "']";
				$(selector).addClass("locked");
				$(selector).append("<span class='fa fa-lock'></span>")
			}

			configureCampHeroInfoLockedHeroes();
		}, 0);
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
			$("#lblCampSelectedHero").hide();
		} else {
			$("#btnCampSubmit").prop("disabled", false);

			configureCampHeroInfoLockedHeroes();
			$("#divContainerCampInfoCombination").show();
			$("#lblCampSelectedHero").show();
			$("#lblCampSelectedHeroCount").html(count);

			if (count > 20) {
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


function configureCampHeroInfoLockedHeroes() {
	var lockedHeroes = getTotalLockedHeroes();
	var selectedHeroes = $("#drpCampHeroSelection").val().length;

	if (lockedHeroes > 0) {
		$("#spanContainerCampInfoLockTotal").show();
		$("#lblCampLockTotal").html(lockedHeroes);

		if (lockedHeroes === 1) {
			$("#lblCampLockHeroNoun").html("hero");
		} else {
			$("#lblCampLockHeroNoun").html("heroes");
		}
	} else {
		$("#spanContainerCampInfoLockTotal").hide();
	}

	$("#lblCampCombination").html(calcCombination((selectedHeroes - lockedHeroes), (4 - lockedHeroes)));
}

function getCampResult() {
	var selectedHeroes = $("#drpCampHeroSelection").val();
	var lockedHeroes = getLockedHeroIds();
	var teams = teamCombinationBuilder(selectedHeroes);
	var result = [];

	for (var i = 0; i < teams.length; i++) {
		var allowed = true;
		
		if (lockedHeroes.length > 0) {
			for (var j = 0; j < lockedHeroes.length; j++) {
				if (!teams[i].includes(lockedHeroes[j])) {
					allowed = false;
					break;
				}
			}
		}

		if (!allowed) {
			continue;
		}


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

				if (typeof biggestTwoMorale[0] === "undefined" || (typeof biggestTwoMorale[0] !== "undefined" && biggestTwoMorale[0].morale <= currentMorale)) {
					if (typeof biggestTwoMorale[0] !== "undefined") {
						if (typeof biggestTwoMorale[1] === "undefined" || 
							(typeof biggestTwoMorale[1] !== "undefined" && heroCampOptionId !== biggestTwoMorale[0].campOptionId)) {
							biggestTwoMorale[1] = biggestTwoMorale[0];
						}
					}

					var newBiggestMorale = {
						"campOption" : "<span class='text-danger'>" + hero.name + "</span> - " + campOptions[heroCampOptionId] + " (" + currentMorale + ")",
						"campOptionNoTags" : hero.name + " - " + campOptions[heroCampOptionId] + " (" + currentMorale + ")",
						"campOptionId" : heroCampOptionId,
						"morale" : currentMorale,
					};

					biggestTwoMorale[0] = newBiggestMorale;
				}

				else if (typeof biggestTwoMorale[1] === "undefined" || (typeof biggestTwoMorale[1] !== "undefined" && biggestTwoMorale[1].morale <= currentMorale)) {
					var newBiggestMorale = {
						"campOption" : "<span class='text-danger'>" + hero.name + "</span> - " + campOptions[heroCampOptionId] + " (" + currentMorale + ")",
						"campOptionNoTags" : hero.name + " - " + campOptions[heroCampOptionId] + " (" + currentMorale + ")",
						"campOptionId" : heroCampOptionId,
						"morale" : currentMorale,
					};

					biggestTwoMorale[1] = newBiggestMorale;
				}
			}
		}

		var teamResult = {
			"heroes" : teamHeroes,
			"heroesJoined" : teamHeroes.join(", "),
			"options" : [ biggestTwoMorale[0].campOption, biggestTwoMorale[1].campOption ],
			"optionsJoined" : biggestTwoMorale[0].campOptionNoTags + ", " + biggestTwoMorale[1].campOptionNoTags,
			"morale" : (biggestTwoMorale[0].morale + biggestTwoMorale[1].morale).toString(),
		};

		result[result.length] = teamResult;
	}

	orderedResult = result.sort(function(a, b) {
		return b.morale - a.morale;
	});

	$("#divContainerCampResultTable").html(generateCampResultHtml(orderedResult));
    $("#divContainerCampResultLoading").hide();
    $("#divContainerCampResultTable").show();
    $("#btnCampSavePdf").prop("disabled", false);

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

function saveResultToPdf() {
	if (orderedResult === null || orderedResult.length === 0) {
		return;
	}

	var pdf = new jsPDF({ compress: true });
	pdf.setLineHeightFactor(1);
	pdf.table(10, 10, orderedResult, [{ name: "heroesJoined", prompt: "Team", width: 100 }, 
									  { name: "optionsJoined", prompt: "Best Camp Options", width: 125 }, 
									  { name: "morale", prompt: "Morale", width: 30 }],
									  { fontSize: 9 });
	pdf.save("Best Camp Reactions.pdf")
}

function getLockedHeroIds() {
	var data = $("#drpCampHeroSelection").select2("data");
	var lockedOptions = $("li.select2-selection__choice.locked");
	var result = [];

	for (var i = 0; i < lockedOptions.length; i++) {
		var name = $(lockedOptions[i]).attr("title");

		for (var j = 0; j < data.length; j++) {
			if (data[j].text === name) {
				result[i] = data[j].id;
				break;
			}
		}
	}

	return result;
}

function getTotalLockedHeroes() {
	return $("li.select2-selection__choice.locked").length;
}