const toUpperFirstLetter = _str => _str.charAt(0).toUpperCase() + _str.slice(1);
function restrictName(_name, _limit, _forbidden_chars){
    _name = _name.substring(0, _limit);

    for (let i = 0; i < _forbidden_chars.length; i++){
        _name = _name.replaceAll(_forbidden_chars[i], '');
    }
    
    return _name;
}
