/*jslint browser: true*/
/*global console, Framework7, hrApp*/

hrApp.angular.factory('DataService', ['$http', function ($http) {
  'use strict';

  var locationCache ={};
  
  var pub = {},
    eventListeners = {
      'resourceClicked' : []
     ,'reviewClicked' : []
    };
  
  pub.addEventListener = function (eventName, callback) {
    eventListeners[eventName].push(callback);
  };
  
  pub.resourceClicked = function (resource) {
    for (var i=0; i<eventListeners.resourceClicked.length; i++) {
      eventListeners.resourceClicked[i](resource);
    }
  };
  
  pub.reviewClicked = function (resource) {
	    for (var i=0; i<eventListeners.reviewClicked.length; i++) {
	      eventListeners.reviewClicked[i](resource);
	    }
 };
  
 
 pub.getReviews = function(resource_id, resource_type){
	 return $http.get('get.php?table=reviews&resource_id='+ resource_id + '&resource_type='+resource_type);
 };
 // http://api.helphubsac.org/api/search?action=index&controller=locations&keyword=meal&location=95831&org_name=&radius=2
 //http://api.helphubsac.org/api/search?category=Youth
 //http://api.helphubsac.org/api/locations/loaves-fishes
 //http://api.helphubsac.org/api/organizations
 	pub.getLocations = function (params) {
    	 
 	var queryString='';
	for(var key in params){
		queryString +='&'+ key + '=' + params[key];
	}
	queryString = encodeURI(queryString.substr(1));
	 
	console.log(queryString);	  	  
	return $http({
	        url: 'http://api.sacsos.org/api/search?'+ queryString,
	        method: "GET",
	        withCredentials: true,
	        headers: { 'Content-Type': 'application/json; charset=utf-8' }
	    });	  	  
  };
  /*
  pub.getDetailInfo = function(slug){
	  return $http({
	        url: 'http://api.helphubsac.org/api/locations/'+ slug,
	        method: "GET",
	        withCredentials: true,
	        headers: { 'Content-Type': 'application/json; charset=utf-8'  }
	    });	  
  }
  */
  // helphubsac
  pub.getDetailInfo = function(slug, resourceList){
	  if(locationCache[slug]){
		  //console.log("get "+slug + " from cache !!!!!");
		  resourceList[slug]= locationCache.slug;
	  }
	  //console.log("get "+slug + " from server");
	  var l= $http({
		        url: 'http://api.sacsos.org/api/locations/'+ slug,
		        method: "GET",
		        withCredentials: true,
		        headers: { 'Content-Type': 'application/json; charset=utf-8'  }
	    	}).then(function (result) {
	    		    var r = result.data;
	    			r = extractSchedule(r);
	    			r.description = fixPhoneNumber(r.description);
	    			resourceList[slug] = r;
			    	locationCache[slug]= r; // store it in the cache
			    	
	        	});
	      
  }
  
  function extractSchedule(resource)
	{
		var weekdays= ['Sun ','Mon ','Tue ','Wed ','Thu ','Fri ','Sat ','Sun '];
		var schedules = resource.regular_schedules;
		if(!schedules)
			return resource;
		
		var today = new Date(); 
		today= today.getDay();
		
		var days= [];
		var open_today= '';
		
		for(var idx in schedules){
			var s = schedules[idx];
			if(s.weekday == today){				
				var closes = s.closes_at.substr(11,2);
				if(closes >12)
					closes = (closes -12 )+' PM';
				open_today += s.opens_at.substr(11,2) +' to '+ closes + ' ';
			}
			if(days.indexOf(s.weekday) == -1)
				days.push(s.weekday);
		}
		var open_days='';
		for(var idx in days)
			open_days += weekdays[days[idx]];
		
		resource.open_days = open_days;
		resource.open_today = open_today; 
		return resource;
	}
	
	function fixPhoneNumber(str){
		var patt = /\(?(\d{3})\)?[ -\.](\d{3})[ -\.](\d{4})/ig ;
		var repl = "<a href='tel:($1) $2-$3' class='external' >($1) $2-$3</a>";		
		return str.replace(patt, repl);
	}
	
  
//======================================================  local storage
  
  pub.getFavorites = function(){
	  if(typeof(Storage) == "undefined") {
		  console.log("local storage not supported");
		  return;
	  }
	  var favorites = localStorage.getItem("favorites");
	  if(! favorites )
		  favorites = [];
	  else
		  favorites = angular.fromJson(favorites);
	  return favorites; 
  }
  
  pub.addToFavorites= function(resource){
	  var slug = resource.slug;
	  
	  if(typeof(Storage) == "undefined") {
		  return;
	  }
	  
	  var favorites = localStorage.getItem("favorites");
	  if(! favorites)
		  favorites = [slug];
	  else{
		  favorites = angular.fromJson(favorites);
		  if(favorites.indexOf(slug) == -1)
		  	favorites.push(slug);
  	  }
	  localStorage.setItem("favorites", angular.toJson(favorites));	  
  }
  
  pub.removeFromFavorites= function(resource){
	  var slug = resource.slug;
	  if(typeof(Storage) == "undefined") {
		    // Code for localStorage/sessionStorage.
		  console.log("local storage not supported");
		  return;
	  }
	  
	  var favorites = localStorage.getItem("favorites");
	  if(! favorites)
		  return;
	  else
		  favorites = angular.fromJson(favorites);
	  
	  var newFavorites = favorites.filter(function(e){return e!== slug })
	  
	  localStorage.setItem("favorites", angular.toJson(newFavorites));
	  
  }
//======================================================  local storage
  
  
  return pub;
  
}]);








//======================================================
///filter
hrApp.angular.filter('openFilter', function() {
	    return function(items, openToday) {
	    	/*
	        var i, c, txt = "";
	        x = x.split("")
	        for (i = 0; i < x.length; i++) {
	            c = x[i];
	            if (i % 2 == 0) {
	                c = c.toUpperCase();
	            }
	            txt += c;
	        }
	        return txt;
	        */
	/*    	
	    	if(openToday){
	    		var ret=[];
	    		var idx=0;
	    		for(var i in items){
	    			if(idx++ <2)
	    				ret.push(i);
	    		}
	    		return ret;
	    	}
	    	else */
	    		return items;
	    };
});
