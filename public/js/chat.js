const socket = io()

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//option
const { username , room } = Qs.parse(location.search,{ ignoreQueryPrefix: true })  

const autoScroll = ()=>{
    // new message element
    const $newMewssage = $messages.lastElementChild

    // height of last massage
    const newMessageStyle = getComputedStyle($newMewssage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMewssage.offsetHeight + newMessageMargin

    // visible height 
    const visibleHeight = $messages.offsetHeight
    // height of messages container
    const containerHeight = $messages.scrollHeight
    // how far scroll 
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight  
    }
}

socket.on('countUpdated' , (count)=>{
    console.log("the cunt has been updated! ", count )
})

socket.on('LocationMessage',(message)=>{
    console.log(message)
    const html =  Mustache.render(locationMessageTemplate,{
        username : message.username, 
        url : message.url,
        createdAt : moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

socket.on('message',(message)=>{
    console.log(message)
    const html = Mustache.render(messageTemplate,{
        username : message.username,
        message : message.text,
        createdAt : moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

document.querySelector('#increment').addEventListener('click',()=>{
    console.log("clicked")
    socket.emit("increment")
})

socket.on('roomData',({room,users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})


// changes
$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault()

    // disabled
    $messageFormButton.setAttribute('disabled', 'disabled')
    // const message = document.querySelector('input').value // for many input type comes from form
    const message = e.target.elements.messages.value

    socket.emit('sendMessage', message , (error)=>{
        //enable
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error){
            return console.log(error)
        }
        console.log("Message Deliverd")
    })
})

$sendLocationButton.addEventListener('click',()=>{
    if(!navigator.geolocation){
        return alert('Geolocation is not supported on your browser')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position)=>{
        // console.log(position)
        socket.emit('sendLocation',{
            latitude : position.coords.latitude,
            longitude : position.coords.longitude
        }, ()=>{
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location Shared')
        })
    })
})

socket.emit('join' , { username , room} , (error)=>{
    if (error){
        alert(error)
        location.href = '/'
    }

})