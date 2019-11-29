
$(document).ready(startApp);

var coinsMatched = 0;
const coinExchangeUpdateInterval = 1750;
const coinReturnTimer = 1500;
const cryptoLocations = {
	playerWallet: [],
	exchange: []
}
let playerMoney = 50;
const maxChartDisplay = 100;
var coinExchangeUpdateTimer = null;
var coinWalletUpdateTimer = null;
var currentlySelectedElements = [];
const adjustmentRatio = [-0.8,-0.5, -0.4, -0.4, -0.2, -0.2, -0.1, -0.1, -0.1, -0.1,0,0,0,0,0, 0.7,0.7,0.5, 0.4, 0.4, 0.4, 0.2, 0.2, 0.2, 0.1, 0.1, 0.1, 0.1]

const sounds = {
	coins: 'sounds/coins.wav',
	error: 'sounds/error.mp3',
	flip: 'sounds/flip.mp3'

}

function startApp(){
	makeCards(coinData);
	coinData.forEach( function(data ){
		addCoinToContainer(data, '#coinExchange');
	});
	coinExchangeUpdateTimer= setInterval(updateCoins.bind(null, cryptoLocations.exchange), coinExchangeUpdateInterval);
	coinWalletUpdateTimer= setInterval(updateCoins.bind(null, cryptoLocations.playerWallet), coinExchangeUpdateInterval);
	displayMessage('Click on coins to reveal.  Match coins to buy them.')
	updateMoneyDisplay();
	updateCoins(cryptoLocations.exchange);
}

function makeCards(coins){
	var cardArray = [];
	for(let coinIndex = 0; coinIndex < coins.length; coinIndex++){
		var thisCoin = coins[coinIndex];
		for(var count=0; count<thisCoin.count; count++){
			var coinContainer = $("<div>",{
				'class': 'coinContainer'
			});
			thisCoin.cards.push(coinContainer);

			coinContainer.click( function(){
				handleCoinClick(coins[coinIndex], event.currentTarget);
			});
			var coin = $("<div>",{
				'class': 'coin'
			});
			var front = $("<div>",{
				'class':'front '+ thisCoin.class,
				css: {
					backgroundImage: `url(${thisCoin.image})`
				}
			});
			var back;
			var back = $("<div>",{
				'class':'back',
				text: '$'
			});
			coin.append(front, back);
			coinContainer.append(coin);
			cardArray.push(coinContainer);			
		}
		

	}
	cardArray = randomizeArray( cardArray );
	$("#coinMatches").append(cardArray);
}

function playSound(file, volume=1){
	var sound = new Audio();
	sound.volume = volume;
	sound.src = file;
	sound.play();	
}

function handleCoinClick( clickedCoinData, clickedElement ){
	if($(clickedElement).hasClass('revealed')){
		return;
	}
	if(currentlySelectedElements.length<2){
		currentlySelectedElements.push({ data: clickedCoinData, element: clickedElement});
		flipCard(clickedElement);
	} else {
		return;
	}
	if(currentlySelectedElements.length===2){
		if(playerMoney>= clickedCoinData.exchangeData.currentPrice){
			if(currentlySelectedElements[0].data.name === currentlySelectedElements[1].data.name){
				$(currentlySelectedElements[0].element).addClass('previouslyMatched');
				$(currentlySelectedElements[1].element).addClass('previouslyMatched');
				coinsMatched+=2;
				playerMoney-=clickedCoinData.exchangeData.currentPrice;
				updateMoneyDisplay();
				playSound(sounds.coins);
				switchCoinToWallet(clickedCoinData, cryptoLocations.exchange, cryptoLocations.playerWallet);
				switchCoinToContainer(clickedCoinData, "#playerWallet");
				currentlySelectedElements = [];
				displayMessage(clickedCoinData.name + ' purchased for ' + clickedCoinData.exchangeData.currentPrice)
				if(coinsMatched === coinData.length){
					console.log('winner');
				}
			} else {
				displayMessage('no match')
				revertCardsStart();
			}
		} else{
			displayMessage('not enough money, sell coins by clicking on them on the left and earn more money')
			revertCardsStart();
			playSound(sounds.error);
		}
		return;
	}
	playSound(sounds.flip);
}
function displayMessage(message){
	$("#message").text(message);
}
function revertCardsStart(){
	setTimeout(function(){
		revertCard(currentlySelectedElements[0].element);
		revertCard(currentlySelectedElements[1].element);
		currentlySelectedElements = [];
	},coinReturnTimer);	
}
/*
	{
		name: 'Bitcoin',
		'class': 'bitcoinLogo',
		image: 'images/BC_logo_.png',
		count: 2,
		cards: [],
		currentPrice: 6314.65
	}
	*/
function addCoinToContainer(data, destination="#coinExchange"){
	if(data.exchangeData){
		data.exchangeData.container.remove();
	}
	var coinContainer = $("<div>",{
		'class': 'walletCoinContainer'
	});
	coinContainer.click(function(){
		switchCoinToWallet(data, cryptoLocations.playerWallet, cryptoLocations.exchange);
		switchCoinToContainer(data, "#coinExchange");	
		sellCoin(data);	
	})
	var coinLogo = $("<div>",{
		'class': 'coinLogo '+data.class,
		css: {
			backgroundImage: `url(${data.image})`
		}
	});
	var coinPrice = $("<div>",{
		'class': 'coinPrice',
		text: data.currentPrice
	})
	var coinChart = $("<canvas>",{
		'class': 'coinChart',
		text: data.name
	});
	cryptoLocations.exchange.push(data);
	coinContainer.append(coinLogo, coinPrice, coinChart);
	$(destination).append(coinContainer);

	data.exchangeData = {
		container: coinContainer,
		logo: coinLogo,
		chart: coinChart,
		price: coinPrice,
		chartContext: coinChart[0].getContext('2d'),
		priceHistory: (data.exchangeData) ? data.exchangeData.priceHistory : new Array(10).fill(data.currentPrice),
	}
}
function switchCoinToWallet(coin, source, destination){
	//gotta deal with arrays being in flux while moving or changing them
	var location = source.indexOf(coin);
	if(location!==-1){
		destination.push( source.splice(location,1)[0]);
		if(destination===cryptoLocations.playerWallet){
			console.log(coin);
			coin.exchangeData.purchasePrice = coin.exchangeData.currentPrice;
		} else {
			delete coin.exchangeData.purchasePrice;
		}
	}
}
function switchCoinToContainer(coin, destination){
	$(destination).append(coin.exchangeData.container);
}

function sellCoin(data){
	console.log("selling", data);
	data.cards.forEach( revertCard );
	playerMoney += data.exchangeData.currentPrice;
	displayMessage('selling '+data.name + ' for ' + data.exchangeData.currentPrice);
	updateMoneyDisplay();
	playSound(sounds.coins);
}
function updateMoneyDisplay(){
	$("#money").text(playerMoney);
}

function updateCoins(exchange){
	for(var i=0; i<exchange.length; i++){
		var currentCoin = exchange[i];
		var shiftAmount = adjustmentRatio[ Math.floor(Math.random()*adjustmentRatio.length)];
		var nextPrice = currentCoin.currentPrice + currentCoin.currentPrice*shiftAmount;
		currentCoin.exchangeData.priceHistory.shift();
		currentCoin.exchangeData.price.text(nextPrice.toFixed(2));
		console.log(` ${nextPrice} vs ${currentCoin.exchangeData.priceHistory[ currentCoin.exchangeData.priceHistory.length -1]}`)
		if(nextPrice> currentCoin.exchangeData.priceHistory[ currentCoin.exchangeData.priceHistory.length -1]){
			currentCoin.exchangeData.price.removeClass('lowerPrice').addClass('higherPrice');
		} else if(nextPrice < currentCoin.exchangeData.priceHistory[ currentCoin.exchangeData.priceHistory.length -1]){
			currentCoin.exchangeData.price.addClass('lowerPrice').removeClass('higherPrice');
		} else {
			currentCoin.exchangeData.price.removeClass('lowerPrice higherPrice');
		}
		currentCoin.exchangeData.priceHistory.push(nextPrice);
		currentCoin.exchangeData.currentPrice = nextPrice;
		drawChart(currentCoin.exchangeData.chartContext,currentCoin.exchangeData );
	}

}

function drawChart(context, data){
	context.strokeStyle="#FF0000";
	context.lineWidth=3;
	var width = context.canvas.width;
	var height = context.canvas.height;
	context.clearRect(0,0,width, height);
	var pixelPerSegment = width/data.priceHistory.length;
	var max = maxChartDisplay//Math.max(...data.priceHistory);
	// if(max<data.purchasePrice){
	// 	max = data.purchasePrice;
	// }
	context.beginPath();
	context.moveTo(0,height -( data.priceHistory[0]/max)*height);
	for(var x = 1; x < data.priceHistory.length; x++){
		context.lineTo(x*pixelPerSegment, height -(data.priceHistory[x]/max)*height);
	}
	context.stroke();
	if(data.purchasePrice){
		context.beginPath();
		context.strokeStyle="#00FF00";
		context.lineWidth=5;
		context.moveTo(0,height-data.purchasePrice/max*height);
		context.lineTo(width,height - data.purchasePrice/max*height);
		context.stroke();		
	}


	
}


function flipCard(element){
	$(element).addClass('revealed');
}
function revertCard(element){
	$(element).removeClass('revealed')
}


function randomizeArray( array ){
	var sourceArray = array.slice();
	var newArray = [];
	while( sourceArray.length ){
		var randomIndex = Math.floor( Math.random() * sourceArray.length );
		newArray.push( sourceArray.splice( randomIndex, 1 )[0]);
	}
	return newArray;
}






