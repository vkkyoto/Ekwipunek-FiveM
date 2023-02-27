const container = document.querySelector('.container')
const box = document.querySelector('.box')
const modal = document.querySelector('.prompt')
const modalConfirm = document.querySelector('.prompt-confirm')
const modalAccept = document.querySelector('.acceptPrompt')
const modalInput = document.querySelector('.promptInput')
const nearbyList = document.querySelector('.nearbyList')

let hoveredElement;

var isOpen = false

var nearbyPlayers = []

var items = [];
var selectedId = -1;
var amountToGive = 0;
var targetedPlayer = 0;

window.addEventListener('message', e => {
    switch(e.data.action) {
        case 'open': {
            if (!isOpen) {
                switch(e.data.type) {
                    case 'primary': {
                        nearbyPlayers = e.data.nearby
                        openPrimaryMenu()
                        break
                    }
                    default: {
                        break
                    }
                }
            }
            break
        }
        case 'updateInv': {
            items = e.data.items
            nearbyPlayers = e.data.nearby
            updatePrimaryMenu()
            break
        }
        case 'itemNotification': {
            itemNotification(e.data.label, e.data.itemlabel, e.data.item, e.data.amount)
            break
        }
        case 'close': {
            closePrimaryMenu()
            break
        }
        case 'bindItems': {
            for (let i = 0; i < 5; ++i) {
                let nnn = i+1
                document.getElementById(`kieszen-${i+1}`).innerHTML = '<div class="kieszen-numer">'+ nnn +'</div>';
                if (e.data.items[i] !== false) {
                    let pocketItemImg = document.createElement('img');
                    pocketItemImg.id = `pocketItemImg-${i+1}`;
                    pocketItemImg.src = "https://cfx-nui-es_extended/html/img/items/" + e.data.items[i].image + ".png";
                    document.getElementById(`kieszen-${i+1}`).appendChild(pocketItemImg);
                }
            }
            break
        }
        default: break
    }
})

document.addEventListener('keyup', (event) => {
    if (event.key == '1' || event.key == '2' || event.key == '3' || event.key == '4' || event.key == '5') {
        moveItemToPocket(event.key);
    }
});

let itemInteractionNotifId = 0;
const itemNotification = (label, itemLabel, item, count) => {
    itemInteractionNotifId++;
    let abc = itemInteractionNotifId;
    $(".notifications").append(`
        <div class="notification-box" id="item-interaction-${abc}">
            ` + (count > 0 && '<span class="count">'+ count +'</span>' || '') +`
            <img src="https://cfx-nui-es_extended/html/img/items/` + item + `.png">
            <span class="itemLabel">`+ itemLabel +`</span>
            <span class="label">`+ label +`</span>
        </div>
    `)
    setTimeout(function () {
        $(`#item-interaction-${abc}`).css('opacity', '1');
        setTimeout(function () {
            $(`#item-interaction-${abc}`).css('opacity', '0');
            setTimeout(function () {
                $(`#item-interaction-${abc}`).remove();
            }, 300)
        }, 2000);
    }, 300);
}

let shownHiddenItems = [];
const openPrimaryMenu = () => {
    container.classList.add('shown')
    document.getElementById('header').style.opacity = '1';
    document.getElementById('header-kieszenie').style.opacity = '1';
    document.getElementById('kieszenie').style.opacity = '1';
    box.classList.add('showee')
    isOpen = true
}

const updatePrimaryMenu = () => {
    container.innerHTML = "";
    for (let i = 0; i < items.length; ++i) {
        let elem = document.createElement('div')
        elem.id = i;
        elem.classList.add('item');
        elem.setAttribute("onMouseEnter", `updateHoveredElement(${i}, 1)`)
        elem.setAttribute("onMouseLeave", `updateHoveredElement(${i}, 0)`)
        shownHiddenItems[i+1] = 'hidden';

        let name = document.createElement('div')
        name.classList.add('item-name')
        name.id = i + "-item-name";
        name.innerHTML = `${items[i].label}`
        elem.appendChild(name)

        let img = document.createElement('img')
        img.classList.add('item-img')
        img.id = i + "-img";
        img.src = "https://cfx-nui-es_extended/html/img/items/" + items[i].image + ".png";
        elem.appendChild(img)

        let count = document.createElement('div')
        count.classList.add('count')
        count.id = i + "-count";
        count.innerHTML = `${items[i].count}`
        elem.appendChild(count)



        let itemOptions = document.createElement('div');
        itemOptions.classList.add('itemOptions')
        //itemOptions.classList.add('hidden')
        itemOptions.id = (i) + "-options";
        elem.appendChild(itemOptions);

        let bDiv = document.createElement('div')
        bDiv.classList.add('buttonContainer')
        //bDiv.classList.add('shown')
        itemOptions.appendChild(bDiv)

        if (items[i].usable) {
            let button = document.createElement('A')
            button.href = '!#'
            button.innerHTML = 'Użyj'
            button.addEventListener('click', handleUse)
            bDiv.appendChild(button)
        }

        if (items[i].canRemove) {
            let remove = document.createElement('A')
            remove.href = '!#'
            remove.innerHTML = 'Wyrzuć'
            remove.addEventListener('click', handleDrop)
            bDiv.appendChild(remove)

            let give = document.createElement('A')
            give.href = '!#'
            give.innerHTML = 'Daj'
            give.addEventListener('click', handleGive)
            bDiv.appendChild(give)
        }
        elem.setAttribute('data-menu', 'primary')

        container.appendChild(elem)
    }
}

const closePrimaryMenu = _ => {
    box.classList.remove('showee')
    setTimeout(function(){
        container.classList.remove('shown')

        modalAccept.removeEventListener('click', handleDropSecondStage)
        modalAccept.removeEventListener('click', handleGiveSecondStage)
        modalInput.value = ''
        modal.classList.remove('shown')
        modalConfirm.classList.remove('shown')

        nearbyList.classList.remove('shown')

        while (nearbyList.firstChild) {
            nearbyList.removeChild(nearbyList.lastChild)
        }

        sendRequest('close', {})
        nearbyPlayers = []
        selectedId = -1
        amountToGive = 0
        isOpen = false
    }, 500)
}

const handleUse = e => {
    e.preventDefault()
    let elem = e.target.parentElement.parentElement.parentElement
    selectedId = elem.id

    /*inventoryNotification('use', items[elem.id].label);*/

    sendRequest('useItem', items[elem.id])
    if (items[elem.id].closeOnUse == true){
        closePrimaryMenu()
    }
}

const handleDrop = e => {
    e.preventDefault()
    let elem = e.target.parentElement.parentElement.parentElement
    let amount = items[elem.id].count
    selectedId = elem.id

    if (items[elem.id].type === 'item_weapon') amount = 1

    //Tutaj to co musi być zawsze
    container.classList.remove('shown')
    document.getElementById('header').style.opacity = '0';
    document.getElementById('header-kieszenie').style.opacity = '0';
    document.getElementById('kieszenie').style.opacity = '0';

    if (amount > 1) {
        modal.classList.add('shown')
        modalAccept.addEventListener('click', handleDropSecondStage)
        modalAccept.innerHTML = "Wyrzuć"
        modalInput.focus()
        modalInput.addEventListener("keyup", function(event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                modalAccept.click();
            }
        });
    } else {
        modalConfirm.classList.add('shown')
        document.querySelector('.acceptPrompt2').addEventListener('click', function(){
            sendRequest('dropItem', {
                ...items[selectedId],
                amount: 1
            })
            closePrimaryMenu()
        });
        document.querySelector('.declinePrompt').addEventListener('click', function(){
            closePrimaryMenu()
        });
    }
}

const handleDropSecondStage = e => {
    e.preventDefault()
    let modal = e.target.parentElement
    let actualAmount = items[selectedId].count
    let amountToDrop = parseInt(modalInput.value)

    modalAccept.removeEventListener('click', handleDropSecondStage)
    modalInput.value = ''
    modal.classList.remove('shown')

    if (!isNaN(amountToDrop) && amountToDrop <= actualAmount) {
        sendRequest('dropItem', {
            ...items[selectedId],
            amount: amountToDrop
        })
        closePrimaryMenu()
    } else {
        sendRequest('invalidAmount', {})
        closePrimaryMenu()
    }
}

const handleGive = e => {
    e.preventDefault()
    let elem = e.target.parentElement.parentElement.parentElement
    let amount = items[elem.id].count
    selectedId = elem.id
    if (items[elem.id] === 'item_weapon') amount = 1
    if (amount > 1) {
        modalAccept.addEventListener('click', handleGiveSecondStage)
        modalAccept.innerHTML = "Daj"
        modal.classList.add('shown')
        modalInput.focus()
        modalInput.addEventListener("keyup", function(event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                modalAccept.click();
            }
        });
        container.classList.remove('shown')
        document.getElementById('header').style.opacity = '0';
        document.getElementById('header-kieszenie').style.opacity = '0';
        document.getElementById('kieszenie').style.opacity = '0';
    } else {
        amountToGive = 1
        container.classList.remove('shown')
        document.getElementById('header').style.opacity = '0';
        document.getElementById('header-kieszenie').style.opacity = '0';
        document.getElementById('kieszenie').style.opacity = '0';

        for (let i = 0; i < nearbyPlayers.length; ++i) {
            let elem = document.createElement('A')
            elem.innerHTML = `#${nearbyPlayers[i]}`
            elem.setAttribute('data-id', nearbyPlayers[i])
            elem.addEventListener('click', handleGiveThirdStage)
            nearbyList.appendChild(elem)
        }

        nearbyList.classList.add('shown')
    }
}

const handleGiveSecondStage = e => {
    e.preventDefault()
    let modal = e.target.parentElement
    let actualAmount = items[selectedId].count
    let toGive = parseInt(modalInput.value)

    modalAccept.removeEventListener('click', handleGiveSecondStage)
    modalInput.value = ''
    modal.classList.remove('shown')

    if (!isNaN(toGive) && toGive <= actualAmount) {
        amountToGive = toGive
        for (let i = 0; i < nearbyPlayers.length; ++i) {
            let elem = document.createElement('A')
            elem.innerHTML = `#${nearbyPlayers[i]}`
            elem.setAttribute('data-id', nearbyPlayers[i])
            elem.addEventListener('click', handleGiveThirdStage)
            nearbyList.appendChild(elem)
        }

        nearbyList.classList.add('shown')
    } else {
        sendRequest('invalidAmount', {})
        closePrimaryMenu()
    }
}

const handleGiveThirdStage = e => {
    let elem = e.target.parentElement
    let amount = amountToGive
    let id = e.target.getAttribute('data-id')

    nearbyList.classList.remove('shown')

    while (nearbyList.firstChild) {
        nearbyList.removeChild(nearbyList.lastChild)
    }

    sendRequest('giveItem', {
        ...items[selectedId],
        amount: amount,
        id: id
    })
    closePrimaryMenu()
}

function updateHoveredElement(elementID, state) {
    if(state == 1) {
        hoveredElement = elementID;
    } else {
        hoveredElement = -1;
    }
}

function moveItemToPocket(pocketNumber) {
    if(hoveredElement >= 0) {
        let elem = document.getElementById(`${hoveredElement}`)
        if (items[elem.id].usable === false) return

        let pocketItemImg = document.createElement('img');
        pocketItemImg.id = `pocketItemImg-${pocketNumber}`;
        pocketItemImg.src = '';
        document.getElementById(`kieszen-${pocketNumber}`).appendChild(pocketItemImg);

        let itemImgSrc = document.getElementById(`${hoveredElement}-img`).src;
        document.getElementById('pocketItemImg-' + pocketNumber).src = itemImgSrc;

        sendRequest('boundItem', {
            ...items[elem.id],
            boundTo: pocketNumber
        })
    }
}

function removeItemFromPocket(pocketNumber) {
    document.getElementById(`pocketItemImg-${pocketNumber}`).remove();
    sendRequest('unboundItem', {
        pocket: pocketNumber
    })
}

document.addEventListener('keyup', e => {
    if (e.key === 'Escape') {
        closePrimaryMenu()
    }
})

const sendRequest = (route, data) => {
    fetch(`https://${GetParentResourceName()}/${route}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify(data)
    });
}

window.onload = function(){
    sendRequest("loaded", {})
}