const socket = io()
//Elements
const $messageForm = document.querySelector("#message-form")
const $locationButton = document.querySelector("#send-location")
const $messageFormInput = document.querySelector("input")
const $messageFormButton = document.querySelector("button")
const $messages = document.querySelector("#messages")

//templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on("message", (m) => {
    console.log(m)

    const html = Mustache.render(messageTemplate, {
        username: m.username,
        message: m.text,
        createdAt: moment(m.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML("beforeend", html)
    autoscroll();
})

socket.on("locationMessage", (message) => {
    console.log(message)
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format("h:mm a")
    })
    $messages.insertAdjacentHTML("beforeend", html)
    autoscroll();
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})


$messageForm.addEventListener("submit", (e) => {
    e.preventDefault();

    $messageFormButton.setAttribute("disabled", "disabled")

    const message = e.target.elements.message.value;

    socket.emit("sendMessage", message, (response, error) => {
        $messageFormButton.removeAttribute("disabled")
        $messageFormInput.value = ''
        $messageFormInput.focus();
        if (error) {
            return console.log(error);
        }
        console.log(response)
    })
})


$locationButton.addEventListener("click", () => {

    if (!navigator.geolocation) {
        return alert("Geolocation not supported")
    }

    $locationButton.setAttribute("disabled", "disabled")
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit("location", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        }, (response) => {
            $locationButton.removeAttribute("disabled")

            console.log(response)
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})