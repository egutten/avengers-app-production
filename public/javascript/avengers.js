// Delete modals for delete profile and delete movie
function modal(obj, modalVersion){
    return function(){
		$(obj).on("click", function() {
			$(modalVersion).show();    
		});
	};   
}

$(document).ready(modal(".delete-profile", ".delete-profile-modal, .modal-background"));
$(document).ready(modal(".delete-movie", ".delete-movie-modal, .modal-background"));

// Modal for delete quotes and revoke admin
$(document).ready(function(){
	$(".delete-quote").on("click", function() {
		var quoteId = $(this).attr("quoteId");
		var movieSlug = $(this).attr("movieSlug");
		var url = "/movies/" + movieSlug + "/quotes/" + quoteId + "?_method=DELETE";
		$('.delete-quote-modal form').attr("action", url);
		$(".delete-quote-modal, .modal-background").show();    
	});
	$('#revoke-admin').change(function() {
        if($(this).is(":checked")) {
          $(".admin-modal, .modal-background").show();
        }       
    });
});

// Close modal (if do not click "yes" for delete modals)
$(".ok, .modal-background").on("click", function(){
  $(".modal, .modal-background").hide();
});

// Fade-in effect for list of who likes what quotes
$(function() {
      $('.pop-up-likes').hide();
      $('.like-button-group').hover( function() {
          $(this).find('.pop-up-likes').fadeToggle();
      } );
});

// Connection to movie database API for autocomplete function in the create movies title input
$(document).ready(function(){
	$("#title").keyup(function(){
		$("#results").empty();
		var that = this;
		var value = $(this).val();
        $.ajax({
          url: 'https://movie-database-imdb-alternative.p.rapidapi.com/?page=1&r=json&s=' + value,
          type: 'GET',
          dataType: 'json',
          beforeSend: setHeader,
		  error: function() { alert('boo!'); },
          success: function(msg) { 
			 $("#results").show();
			 if(value==$(that).val() && msg["Error"] == undefined) {
				 msg["Search"].forEach (function(e){
					 renderResults(e["Title"]);
				});
			 }
		  },
        });
	});
});

function setHeader(xhr) {
	xhr.setRequestHeader('X-RapidAPI-Host', 'movie-database-imdb-alternative.p.rapidapi.com');
	xhr.setRequestHeader('X-RapidAPI-Key', '744649b923msh40807d2067eaedcp1232b1jsn3a6f0d89e715');
 }

// Fills title input with whatever user chooses in list from movie database
$("#results").on("click", "li.select", function(){
	$("#title").val($(this).text());
	$("#results").hide();
});

// Displays dropdown list of movie titles; trigger functionality refreshes the list if the user starts over
function renderResults(title){
	 var option = document.createElement("li");
	 option.innerHTML = title;
	 option.classList.add("select");
	 $("#results").append(option);
	 $("#results").trigger("chosen:updated");
}
