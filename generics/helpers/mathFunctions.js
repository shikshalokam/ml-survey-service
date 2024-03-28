const { create, all } = require('mathjs')
// create a mathjs instance
const math = create(all)

math.import({
  compareTextValues: function (string1, string2) {

    if(typeof string1 != "string" || typeof string2 != "string") {
      return -1
    }
    
    let searchUniverse = new Array
    let matchOperator = ''
    let searchString = ''
    if(string1.split('||').length > 1) {
      searchUniverse = string1.split('||')
      matchOperator = 'or'
      searchString = string2
    } else if (string1.split('&&').length > 1) {
      searchUniverse = string1.split('&&')
      matchOperator = 'and'
      searchString = string2
    } else if (string2.split('||').length > 1) {
      searchUniverse = string2.split('||')
      matchOperator = 'or'
      searchString = string1
    } else if (string2.split('&&').length > 1) {
      searchUniverse = string2.split('&&')
      matchOperator = 'and'
      searchString = string1
    }

    let compareTextValuesResult = -1

    if (matchOperator === 'or') {
      for (let pointerToSearchUniverseArray = 0; pointerToSearchUniverseArray < searchUniverse.length; pointerToSearchUniverseArray++) {
        if(searchUniverse[pointerToSearchUniverseArray] == searchString) {
          compareTextValuesResult = 0
          break;
        }
      }
    } else if (matchOperator === 'and') {
      compareTextValuesResult = 0
      for (let pointerToSearchUniverseArray = 0; pointerToSearchUniverseArray < searchUniverse.length; pointerToSearchUniverseArray++) {
        if(searchUniverse[pointerToSearchUniverseArray] != searchString) {
          compareTextValuesResult = -1
          break;
        }
      }
    } else {
      if(string1 == string2) {
        compareTextValuesResult = 0
      }
    }

    return compareTextValuesResult

  },
  compareDates: function (dateArg1, dateArg2) {
    let date1
    if(typeof dateArg1 === "string") {
      date1 = new Date(dateArg1.replace( /(\d{2})-(\d{2})-(\d{4})/, "$2/$1/$3"))
    } else {
      date1 = new Date(dateArg1)
    }
    
    let date2
    if(typeof dateArg2 === "string") {
      date2 = new Date(dateArg2.replace( /(\d{2})-(\d{2})-(\d{4})/, "$2/$1/$3"))
    } else {
      date2 = new Date(dateArg2)
    }

    date1.setHours(0)
    date1.setMinutes(0)
    date1.setSeconds(0)
    date2.setHours(0)
    date2.setMinutes(0)
    date2.setSeconds(0)

    if(date1 > date2) {
      return 1
    } else if (date1 < date2) {
      return -1
    } else {
      return 0
    }
  },
  checkIfPresent: function (needle, haystack) {
    let searchUniverse = new Array
    if(haystack._data) {searchUniverse = haystack._data} else {searchUniverse = haystack}

    if(typeof needle != "string" && typeof needle != "number") {
      return -1
    }
    
    let searchParameters = new Array
    let matchOperator = ''
    if(needle.split('||').length > 1) {
      searchParameters = needle.split('||')
      matchOperator = 'or'
    } else if (needle.split('&&').length > 1) {
      searchParameters = needle.split('&&')
      matchOperator = 'and'
    }

    let checkIfPresentResult = -1

    if (matchOperator === 'or') {
      for (let pointerToSearchParametersArray = 0; pointerToSearchParametersArray < searchParameters.length; pointerToSearchParametersArray++) {
        if(searchUniverse.findIndex( arrayElement => arrayElement === searchParameters[pointerToSearchParametersArray]) >= 0) {
          checkIfPresentResult = 0
          break;
        }
      }
    } else if (matchOperator === 'and') {
      checkIfPresentResult = 0
      for (let pointerToSearchParametersArray = 0; pointerToSearchParametersArray < searchParameters.length; pointerToSearchParametersArray++) {
        if(searchUniverse.findIndex( arrayElement => arrayElement === searchParameters[pointerToSearchParametersArray]) < 0) {
          checkIfPresentResult = -1
          break;
        }
      }
    } else {
      checkIfPresentResult = searchUniverse.findIndex( arrayElement => arrayElement === needle)
    }

    return checkIfPresentResult
  },
  checkIfModeIs: function (needle, haystack, optionRank = false) {

    let searchKey
    let isMode

    if(needle._data) {

      searchKey = needle._data
      searchKey.sort()
      haystack.forEach(haystackElm => {
        if(haystackElm != "") {haystackElm.sort()}
      })

      let countOfElements = Object.entries(_.countBy(haystack)).sort((a,b) => {return b[1]-a[1]})
      
      isMode = (_.isEqual(countOfElements[0][0].split(','), searchKey) && ((countOfElements[1]) ? countOfElements[0][1] > countOfElements[1][1] : true )) ? 1 : -1
    
    } else {

      if(typeof needle != "string" && typeof needle != "number") {
        return -1
      }

      let searchParameters = new Array
      let matchOperator = ''
      
      if(needle.split('||').length > 1) {
        searchParameters = needle.split('||')
        matchOperator = 'or'
      } else if (needle.split('&&').length > 1) {
        searchParameters = needle.split('&&')
        matchOperator = 'and'
      }

      searchKey = needle

      let countOfElements = Object.entries(_.countBy(haystack)).sort((a,b) => {return b[1]-a[1]})

      if(countOfElements[0] && countOfElements[1] && countOfElements[0][1] == countOfElements[1][1] && optionRank) {
        let elementsWithHighestCount = new Array
        countOfElements.forEach(eachCountOfElement => {
          if(eachCountOfElement[1] == countOfElements[0][1]) {
            elementsWithHighestCount.push(eachCountOfElement[0])
          }
        })
        let optionRankFromLowToHigh = new Array
        if(optionRank.split("<".length > 0)) {
          optionRankFromLowToHigh = optionRank.split("<")
        } else if (optionRank.split(">".length > 0)) {
          optionRankFromLowToHigh = _.reverse(optionRank.split(">"));
        }
        let modeWinner 
        let modeWinnerFound = false
        for (let pointerToElementsWithHighestCount = 0; pointerToElementsWithHighestCount < elementsWithHighestCount.length; pointerToElementsWithHighestCount++) {
          if(!modeWinnerFound) {
            modeWinnerFound = true
            modeWinner = optionRankFromLowToHigh.indexOf(elementsWithHighestCount[pointerToElementsWithHighestCount])
          } else if (optionRankFromLowToHigh.indexOf(elementsWithHighestCount[pointerToElementsWithHighestCount]) < modeWinner) {
            modeWinner = optionRankFromLowToHigh.indexOf(elementsWithHighestCount[pointerToElementsWithHighestCount])
          }
        }
        if(modeWinnerFound) {
          haystack.push(optionRankFromLowToHigh[modeWinner])
          countOfElements = Object.entries(_.countBy(haystack)).sort((a,b) => {return b[1]-a[1]})
        }
      }
      
      isMode = -1
      let modeValueCalculated

      if (matchOperator === 'or') {
        for (let pointerToSearchParametersArray = 0; pointerToSearchParametersArray < searchParameters.length; pointerToSearchParametersArray++) {
          modeValueCalculated = (countOfElements[0][0] === searchParameters[pointerToSearchParametersArray] && ((countOfElements[1]) ? countOfElements[0][1] > countOfElements[1][1] : true )) ? 1 : -1
          if(modeValueCalculated >= 0) {
            isMode = 0
            break;
          }
        }
      } else if (matchOperator === 'and') {
        isMode = 0
        for (let pointerToSearchParametersArray = 0; pointerToSearchParametersArray < searchParameters.length; pointerToSearchParametersArray++) {
          modeValueCalculated = (countOfElements[0][0] === searchParameters[pointerToSearchParametersArray] && ((countOfElements[1]) ? countOfElements[0][1] > countOfElements[1][1] : true )) ? 1 : -1
          if(modeValueCalculated < 0) {
            isMode = -1
            break;
          }
        }
      } else {
        isMode = (countOfElements[0][0] === searchKey && ((countOfElements[1]) ? countOfElements[0][1] > countOfElements[1][1] : true )) ? 1 : -1
      }
      
    }

    // if(needle._data) {
    //   isMode = (_.isEqual(countOfElements[0][0].split(','), searchKey) && ((countOfElements[1]) ? countOfElements[0][1] > countOfElements[1][1] : true )) ? 1 : -1
    // } else {
    //   isMode = (countOfElements[0][0] === searchKey && ((countOfElements[1]) ? countOfElements[0][1] > countOfElements[1][1] : true )) ? 1 : -1
    // }

    return isMode
  },
  modeValue: function (haystack) {
    const countOfElements = Object.entries(_.countBy(haystack)).sort((a,b) => {return b[1]-a[1]})
    return countOfElements[0][1]
  },
  percentageOf: function (needle, haystack) {
    const countOfElements = _.countBy(haystack)
    return (countOfElements[needle]) ? Math.round((countOfElements[needle]/haystack.length)*100) : 0
  },
  averageOf: function (haystack) {
    haystack = haystack.map(x => parseInt(x));
    return Math.round(_.sum(haystack)/haystack.length)
  },
  differenceInDays: function (dateArg1, dateArg2) { 

    let date1
    let date2
    
    if(typeof dateArg1 === "string") {
      date1 = new Date(dateArg1.replace( /(\d{2})-(\d{2})-(\d{4})/, "$2/$1/$3"))
    } else {
      date1 = new Date(dateArg1)
    }

    if(typeof dateArg2 === "string") {
      date2 = new Date(dateArg2.replace( /(\d{2})-(\d{2})-(\d{4})/, "$2/$1/$3"))
    } else {
      date2 = new Date(dateArg2)
    }

    date1.setHours(0)
    date1.setMinutes(0)
    date1.setSeconds(0)
    date2.setHours(0)
    date2.setMinutes(0)
    date2.setSeconds(0)

    return Math.abs(Math.ceil((date1.getTime() - date2.getTime()) / (1000 * 3600 * 24)))
  }
})


module.exports = math;
