ESX = exports["es_extended"]:getSharedObject()

AddEventHandler('esx:onPlayerDeath', function()
	isDead = true
end)

AddEventHandler('playerSpawned', function()
	isDead = false
end)

Inventory = {}
Inventory.Data = nil
Inventory.Opened = false
Inventory.Loaded = false

Inventory.HasInventoryItem = function(name)
	for k,v in ipairs(Inventory.Data.inventory) do
		if v.name == name then
			return v.count
		end
	end
	return 0
end

exports("HasInventoryItem", Inventory.HasInventoryItem)

Inventory.Refresh = function(playerData)
	while not Inventory.Loaded do
		Wait(0)
	end
	Wait(100)
	Inventory.Data = (playerData or ESX.GetPlayerData())

	Inventory.RefreshBinds()

	local PlayerInventory = {}

	for k,v in pairs(Inventory.Data.accounts) do
		if v.money > 0 and v.name == 'money' then
			table.insert(PlayerInventory, {
				label = v.label,
				count = v.money,
				type = 'item_account',
				name = v.name,
				usable = false,
				rare = false,
				canRemove = true,
				
				image = v.name
			})
		end
	end

	for k,v in pairs(Inventory.Data.accounts) do
		if v.money > 0 and v.name == 'black_money' then
			table.insert(PlayerInventory, {
				label = v.label,
				count = v.money,
				type = 'item_account',
				name = v.name,
				usable = false,
				rare = false,
				canRemove = true,
				
				image = v.name
			})
		end
	end

	for k,v in ipairs(Inventory.Data.inventory) do
		if v.count > 0 then
			if v.type == 'item' then
				table.insert(PlayerInventory, {
					label = v.label,
					count = v.count,
					type = 'item_standard',
					name = v.name,
					usable = v.usable,
					rare = v.rare,
					canRemove = v.canRemove,

					image = v.name
				})
			elseif v.type == 'weapon' then
				for _,d in ipairs(ESX.GetConfig().Weapons) do
					if v.data.name == d.name then
						if d.take_ammo then
							label = (v.data.serial_number == false and (v.label .. " " .. "[" .. v.data.ammo .. "]") or (v.label .. " " .. "[" .. v.data.ammo .. "]\n[" .. v.data.serial_number .. "]"))
						else
							label = (v.data.serial_number == false and (v.label) or (v.label .. " " .. "[" .. v.data.serial_number .. "]"))
						end
		
						table.insert(PlayerInventory, {
							label = label,
							count = 1,
							type = 'item_weapon',
							name = v.name,
							usable = true,
							rare = v.rare,
							canRemove = v.canRemove,
							canGiveAmmo = d.take_ammo,
							
							data = v.data,
							components = v.components,
							tintIndex = v.tintIndex,

							image = v.data.name,
							closeOnUse = true
						})	
					end
				end
			elseif v.type == 'sim' then
				table.insert(PlayerInventory, {
					label = v.label,
					count = 1,
					type = 'item_sim',
					name = v.name,
					usable = true,
					rare = v.rare,
					canRemove = v.canRemove,
					data = v.data,

					image = "sim"
				})
			end
		end
	end

	local playerPed = PlayerPedId()
	local playersNearby = ESX.Game.GetPlayersInArea(GetEntityCoords(playerPed), 3.0)
	local nearbyPlayers = {}
	if #playersNearby > 0 then
		for k, playerNearby in ipairs(playersNearby) do
			table.insert(nearbyPlayers, GetPlayerServerId(playerNearby))
		end
	end
	SendNUIMessage({
		action = "updateInv",
		items = PlayerInventory,
		nearby = nearbyPlayers
	})
end

Inventory.GetBind = function(key)
	return json.decode(GetResourceKvpString("WaitRPKeyBinds-" .. key))
end

Inventory.RefreshBinds = function()
	local elements = {}
	for i = 1, 5, 1 do
		elements[i] = Inventory.GetBind(i)
	end
	SendNUIMessage({
		action = "bindItems",
		items = elements
	})
end

--[[Inventory.UseBind = function(key)
	local Item = Inventory.GetBind(key)
	if Item then
		local name = Item.name
		local type = Item.type
		if type == 'item_weapon' then
			TriggerEvent('es_extended:useSlot', name)
		else
			TriggerServerEvent('esx:useItem', name)
		end
	end
	Inventory.RefreshBinds()
end]]

Inventory.UseBind = function(key)
	if not isDead then
		if not exports['esx_policejob']:IsCuffed() then
			local Item = Inventory.GetBind(key)
			if Item then
				local name = Item.name
				local type = Item.type
				ESX.TriggerServerCallback('gcphone:getItemAmount', function(count)
					if count > 0 then
						if type == 'item_weapon' then
							TriggerEvent('es_extended:useSlot', name)
						else
							TriggerServerEvent('esx:useItem', name)
						end
					end
				end, Item.name)
			end
		end
	end
	Inventory.RefreshBinds()
end

Inventory.BindItem = function(key, item)
	SetResourceKvp("WaitRPKeyBinds-" .. key, json.encode(item))
	Inventory.RefreshBinds()
end

Inventory.UnBindItem = function(key)
	DeleteResourceKvp("WaitRPKeyBinds-" .. key)
	Inventory.RefreshBinds()
end

Inventory.Open = function()
	if Inventory.Opened then
		return
	end

	local playerPed = PlayerPedId()
	local playersNearby = ESX.Game.GetPlayersInArea(GetEntityCoords(playerPed), 3.0)
	local nearbyPlayers = {}
	if #playersNearby > 0 then
		for k, playerNearby in ipairs(playersNearby) do
			table.insert(nearbyPlayers, GetPlayerServerId(playerNearby))
		end
	end

	SendNUIMessage({
		action = "open",
		type = "primary",
		nearby = nearbyPlayers
	})
	SetNuiFocus(true, true)
	Inventory.Opened = true
end

Inventory.Close = function(nui)
	if nui then
		SendNUIMessage({
			action = "close"
		})
	end
	SetNuiFocus(false, false)
	Inventory.Opened = false
end

Inventory.Notification = function(label, itemlabel, item, amount)
	SendNUIMessage({
		action = "itemNotification",
		label = label,
		itemlabel = itemlabel,
		item = item,
		amount = amount
	})
end

RegisterNetEvent("wait_inventory:notification")
AddEventHandler("wait_inventory:notification", Inventory.Notification)

AddEventHandler("onClientResourceStart", function(res)
	if res == GetCurrentResourceName() then
		if Inventory.Data == nil then
			if ESX.PlayerLoaded then
				Citizen.Wait(500)
				Inventory.Refresh()
			end
		end
	end
end)

RegisterNetEvent('esx:playerLoaded')
AddEventHandler('esx:playerLoaded', function(playerData)
	Citizen.Wait(500)
	Inventory.Refresh(playerData)
end)

RegisterNetEvent('esx:setAccountMoney')
AddEventHandler('esx:setAccountMoney', function(account)
	Citizen.Wait(500)
	Inventory.Refresh()
end)

RegisterNetEvent('esx:addInventoryItem')
AddEventHandler('esx:addInventoryItem', function(item, count)
	Citizen.Wait(500)
	Inventory.Refresh()
end)

RegisterNetEvent('esx:removeInventoryItem')
AddEventHandler('esx:removeInventoryItem', function(item, count)
	Citizen.Wait(500)
	Inventory.Refresh()
end)

exports("UpdateWeaponAmmo", function(name, ammo)
	for k,v in ipairs(Inventory.Data.inventory) do
		if v.type == "weapon" then
			if v.name == name then
				Inventory.Refresh()
			end
		end
	end
end)

RegisterNUICallback("close", function()
	Inventory.Close()
end)

RegisterNUICallback("useItem", function(data, cb)
	local item, type = data.name, data.type
	if type == 'item_weapon' then
		TriggerEvent('es_extended:useSlot', item)
	else
		TriggerServerEvent('esx:useItem', item)
	end
end)

RegisterNUICallback("giveItem", function(data)
	CreateThread(function()
		RequestAnimDict("mp_common")
		while not HasAnimDictLoaded("mp_common") do
		  	Citizen.Wait(0)
		end
		TaskPlayAnim(PlayerPedId(), "mp_common", "givetake2_a", 8.0, -8.0, -1, 0, 0, false, false, false)
	end)
	TriggerServerEvent('esx:gitestveInventoryItem', data.id, data.type, data.name, data.amount)
	Inventory.Notification("Przekazano", data.label, data.image, 1)
	Inventory.Refresh()
end)

RegisterNUICallback("dropItem", function(data, cb)
	print("es")
	local item, type, quantity = data.name, data.type, data.amount

	local playerPed = PlayerPedId()
	local dict, anim = 'weapons@first_person@aim_rng@generic@projectile@sticky_bomb@', 'plant_floor'
	ESX.Streaming.RequestAnimDict(dict)

	TaskPlayAnim(playerPed, dict, anim, 8.0, 1.0, 1000, 16, 0.0, false, false, false)
	Citizen.Wait(1000)
	TriggerServerEvent('esx:removeInventoryItem', type, item, quantity)
	Inventory.Notification("Wyrzucono", data.label, data.image, 1)
	Inventory.Refresh()
end)

RegisterNUICallback("boundItem", function(data)
	Inventory.BindItem(data.boundTo, {name = data.name, type = data.type, image = data.image})
end)

RegisterNUICallback("unboundItem", function(data)
	Inventory.UnBindItem(data.pocket)
end)

RegisterNUICallback("loaded", function()
	Inventory.Loaded = true
end)

RegisterCommand("+inventoryOpenWaitRPTop1", function()
	if not isDead then
		if not exports['esx_policejob']:IsCuffed() then
			Inventory.Open()
		end
	end
end)

RegisterKeyMapping("+inventoryOpenWaitRPTop1", "Otwórz Ekwipunek", "keyboard", "F2")

for i = 1, 5, 1 do
	RegisterCommand("+inventoryBindsUse" .. i, function()
		Inventory.UseBind(i)
	end)
	RegisterKeyMapping("+inventoryBindsUse" .. i, "Slot #" .. i, "keyboard", tostring(i))
end