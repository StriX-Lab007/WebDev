let input = document.getElementById('inputBox');
let buttons = document.querySelectorAll('button');

let string = "";
let arr = Array.from(buttons);
arr.forEach(button => {
    button.addEventListener('click', (e) => {
        switch (e.target.innerHTML) {
            case '=':
                try {
                    string = eval(string);
                    input.value = string;
                } catch (error) {
                    input.value = "Error";
                }
                break;
            case 'AC':
                string = "";
                input.value = string;
                break;
            case 'DEL':
                string = string.substring(0, string.length - 1);
                input.value = string;
                break;
            default:
                string += e.target.innerHTML;
                input.value = string;
        }
    })
})