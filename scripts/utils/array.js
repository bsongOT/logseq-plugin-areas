function findIndex2(_arr, _callback){
    for (let i = 0; i < _arr?.length; i++)
        for (let j = 0; j < _arr[i].length; j++)
            if (_callback(_arr[i][j])) return [i, j];
    return [-1, -1];
}
function findIndex3(){
    for (let i = 0; i < _arr?.length; i++)
        for (let j = 0; j < _arr[i].length; j++)
            for (let j = 0; k < _arr[i][j].length; k++)
                if (_callback(_arr[i][j][k])) return [i, j, k];
    return [-1, -1, -1];
}
function indexOfMin(arr){
    let idx = 0;
    
    for (let i = 1; i < arr.length; i++)
        if (arr[i] < arr[idx])
            idx = i;
    
    return idx;
}
function preventOverlap(arr, str, orginIdx){
    let result = str;
    let count = arr.filter((a, i) => a === result && i !== orginIdx).length;
    let i = 1;

    while (count >= 1) {
        result = `${str} ${i++}`;
        count = arr.filter((a, i) => a === result && i !== orginIdx).length;
    }

    return result;
}