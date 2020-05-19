const socket = io()

//elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')


//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML


//Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true})

const autoscroll = ()=> {
    //New message element
    const $newMessage = $messages.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //height of messages container
    const containerHeight = $messages.scrollHeight

    //how far have i scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('welcomeMessage', (message) => {
    console.log(message) 
})
socket.on('messageReceived', (message) => {
    console.log( message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('hh:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})
socket.on('location', (location) => {
    console.log(location)
    const html = Mustache.render(locationTemplate, {
        username: location.username,
        location: location.url,
        createdAt: moment(location.createdAt).format('hh:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room, 
        users
    })
    document.querySelector('#sidebar').innerHTML = html

})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    //disable
    $messageFormButton.setAttribute('disabled', 'disabled')
    const message = e.target.elements.message.value
    //console.log(message)
    socket.emit('message',message, (error) => {
        //enable
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if(error) {
            return console.log(error)
        }

        console.log('message delivered!')
    })
})

$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }
    $sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude
        },(error) => {
            if(error) {
                return console.log(error)
            }
            $sendLocationButton.removeAttribute('disabled')
            console.log('location shared!')
        })
    })
})

socket.emit('join', {username,room}, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})