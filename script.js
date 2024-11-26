document.addEventListener("DOMContentLoaded", () => {
    const categoryApiUrl = `https://opentdb.com/api_category.php`
    fetch(categoryApiUrl)
        .then(response => {
            if (!response.ok) {
                console.log("API Call Error", response.statusText)
                throw new Error("API CALL Error : Response Status", response.status, response.statusText)
            }
            return response.json()
        })
        .then(data => {

            const categories = data.trivia_categories

            categories.forEach((category) => {
                const categoryType = document.getElementById("category-type")
                const option = document.createElement("option")
                option.innerText = category.name
                option.value = category.id
                categoryType.appendChild(option)

            })


        })
        .catch(error => {
            console.log("API Error", error)
        })

})
const formWrapper = document.querySelector(".form-wrapper")
const questionsInput = document.querySelector("#questions")
const categoryInput = document.querySelector("#category-type")
const difficultyInput = document.querySelector("#select-difficulty")
const typeInput = document.querySelector("#select-type")

const form = document.querySelector("form")
form.addEventListener("submit", (e) => {
    e.preventDefault()
    const questions = questionsInput.value
    const category = categoryInput.value
    const difficulty = difficultyInput.value
    const type = typeInput.value

    apiCall(questions, category, difficulty, type)

})
let questionCounter = 0;
let correct = [];
let incorrect = [];
let unattemped = []

async function apiCall(questions, category, difficulty, type) {
    // API URL
    let apiURL = `https://opentdb.com/api.php?amount=${questions}`
    if (category) apiURL += `&category=${category}`
    if (difficulty) apiURL += `&difficulty=${difficulty}`
    if (type) apiURL += `&type=${type}`

    try {
        const response = await fetch(apiURL)

        if (!response.ok) {
            console.log("API ERROR", response.status)
            throw response.statusText
        }

        //Note - response code of api means
        // *Code 0: Success Returned results successfully.
        // Code 1: No Results Could not return results. The API doesn't have enough questions for your query. (Ex. Asking for 50 Questions in a Category that only has 20.)
        // Code 2: Invalid Parameter Contains an invalid parameter. Arguements passed in aren't valid. (Ex. Amount = Five)
        // Code 3: Token Not Found Session Token does not exist.
        // Code 4: Token Empty Session Token has returned all possible questions for the specified query. Resetting the Token is necessary.
        // Code 5: Rate Limit Too many requests have occurred. Each IP can only access the API once every 5 seconds. 

        //steps
        //1. Create a question page with options  and timer on that page , 
        //when time finishes automatic go to the next question , if user ticked the
        // question then go for right or wrong , if not then go for unattemped
        //2. when quize completed , show the user their final score 

        const data = await response.json()

        const responseCode = data.response_code
        const resultsArr = data.results //array

        const questionsArr = resultsArr.map(result => {
            return result.question
        })
        console.log("Questions Array in api call", questionsArr)


        const correctAnswers = resultsArr.map(result => {
            return result.correct_answer
        })


        const incorrectAnswers = resultsArr.map(result => {
            return result.incorrect_answers
        })

        const optionsArr = incorrectAnswers.map((subarray, index) => {
            return [...subarray, correctAnswers[index]]

        })

        app(responseCode, questionsArr, optionsArr, correctAnswers)


    } catch (error) {
        console.log("Error", error)
        formWrapper.classList.add("final-score")
        formWrapper.innerHTML = `<h1>Error: Could not fetch questions. Please try again later.</h1>`;

    }
}



function app(responseCode, questionsArr, optionsArr, correctAnswers) {
    console.log(responseCode)

    switch (responseCode) {
        case 0:

            if (questionCounter >= questionsArr.length) {
                formWrapper.classList.add("final-score")
                
                formWrapper.innerHTML = `
                    <h1>Quiz Complete!</h1>
                    <p>Correct Answers: ${correct.length}</p>
                    <p>Incorrect Answers: ${incorrect.length}</p>
                    <p>Unattempted Answers: ${unattemped.length}</p>
                    
                `;
                return;
            }

            const timeLimit = 10000

            formWrapper.innerHTML = ""

            const div = document.createElement("div")
            div.classList.add("question-page")

            const h1 = document.createElement("h1")
            h1.innerText = `Q${questionCounter + 1}. ${questionsArr[questionCounter]}`
            formWrapper.appendChild(div)
            div.appendChild(h1)


            const timerElement = document.createElement("div")
            timerElement.classList.add("timer")
            div.appendChild(timerElement)
            let time = timeLimit / 1000;

            const timeInterval = setInterval(() => {
                timerElement.innerText = `${time--}`
                
                if (time < 0) clearInterval(timeInterval)

            }, 1000)

            const timeout = setTimeout(()=>{
                unattemped.push(questionCounter)
                questionCounter++;
                app(responseCode, questionsArr, optionsArr, correctAnswers)

            },timeLimit)






            optionsArr[questionCounter].forEach((option) => {

                const button = document.createElement("button")
                button.classList.add("option")
                button.innerText = option
                div.appendChild(button)

                button.addEventListener("click", (e) => {

                    if (e.target.innerText == correctAnswers[questionCounter]) {
                        correct.push(questionCounter)
                        clearTimeout(timeout)
                        clearInterval(timeInterval)


                    } else if (!(e.target.innerText == correctAnswers[questionCounter])) {
                        incorrect.push(questionCounter)
                        clearTimeout(timeout)
                        clearInterval(timeInterval)

                    }
                    questionCounter++;
                    app(responseCode, questionsArr, optionsArr, correctAnswers)
                })

            })
            break;

        case 1:
            formWrapper.innerHTML = " "
            const firstDiv = document.createElement("div")
            firstDiv.classList.add("question-page")

            const firstH1 = document.createElement("h1")


            firstH1.innerText = "No Results Could not return results. The API doesn't have enough questions for your query."
            formWrapper.appendChild(firstDiv)
            firstDiv.appendChild(firstH1)
            break;

        case 2:
            formWrapper.innerHTML = " "
            const secondDiv = document.createElement("div")
            secondDiv.classList.add("question-page")

            const secondH1 = document.createElement("h1")

            secondH1.innerText = "Invalid Parameter Contains an invalid parameter. Arguements passed in aren't valid."
            formWrapper.appendChild(secondDiv)
            formWrapper.appendChild(secondH1)
            break;

        case 5:
            formWrapper.innerHTML = " "

            h1.innerText = "Rate Limit Too many requests have occurred. Each IP can only access the API once every 5 seconds."
            formWrapper.appendChild(h1)
            break;

    }
}






