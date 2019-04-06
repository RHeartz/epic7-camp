var factorialMemo = [];


function calcCombination(total, select) {
	if (total < select) {
		return 1;
	}

	return factorial(total) / (factorial(select) * factorial (total - select));
}


function factorial(n) {
	if (n == 0 || n == 1) {
    	return 1;
    }

  	if (factorialMemo[n] > 0) {
    	return factorialMemo[n];
    }
  
  	return factorialMemo[n] = factorial(n - 1) * n;
}