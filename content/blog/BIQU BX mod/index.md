---
title: BIQU BX MOD
date: "2025-01-01T07:48:03.284Z"
description: "Howto for installing Klipper on the Big Tree Tech BIQU BX."
--- 
# Klipper on the BIQU BX
The Biqu BX is now supported in mainstream klipper! I updated the steps a bit to make it a little clearer
_**NOTE: CAN will not work on this board due to a hardware mis-configuration**_
_**NOTE: I2C is not quite working yet!**_

First, a few requirements:
1. You need Klipper setup on your Raspberry PI with your favorite control interface (Octoprint, Fluidd, Mainsail, etc..).
2. You need your favorite Touchscreen UI installed (unless you just want to run headless). There is more on the HDMI config for the RPI below.
   * For Octoprint, I recommend OctoDash
   * For Fluidd and Mainsail, I recomment KlipperScreen
3. You **MUST** have removed the Z endstop physical switch. Not disconnected, but completely removed.

Ok, so let's get started.

# Details 

For root access through SSH
username : mike
pwd      : 098567

Installation Steps Followed:

Used image: Raspberry Pi OS Lite x64

enable WiFi in imaging process
enable SSH in imaging process

sudo apt-get install git
sudo apt-get install ffmpeg

git clone https://github.com/dw-0/kiauh

run

kiauh/kiauh.sh

install:
- Klipper
- Fluid, Mainsail
- Klipperscreen

## Flasing the board
The "make flash" command does not work on the SKR SE BX. Instead,
after running "make", copy the generated "out/klipper.bin" file to a
file named "firmware.bin" on an SD card and then restart the SKR SE BX
with that SD card. 
Once you manage to compile the firmware, you can copy it to enable you 
to download it from the config folder through using the web interface, like so

cp klipper/out/klipper.bin printer_data/config/firmware./bin

After klipper has been flashed once to the board, you can update klipper by leaving a microSD inserted and running the
scripts/flash-sd.sh script.

base printer.cfg:

https://github.com/Klipper3d/klipper/blob/master/config/printer-biqu-bx-2021.cfg



***

## Klipper firmware configuration
When configuring the klipper firmware to run on the BTT SKR SE BX board, there are a couple things to know about.
1. Use the main klipper branch.
2. In order for the toucscreen to work, you will need to set GPIO pins PB5 and PE5 to an initial state during the config
3. Use the `config/printer-biqu-bx-2021.cfg` file for your intial printer.cfg
4. Once you are setup, you will need to calibrate your sensorless homing: https://www.klipper3d.org/TMC_Drivers.html?h=sensorless+ho#sensorless-homing

![Klipper Firmware Configuration](https://user-images.githubusercontent.com/12093019/135688767-e3227299-ca6f-4a39-a1e2-7b892a0e561c.png)

### A note on connection methods:
There are 4 different connections you can make from the Raspberry Pi to the mainboard, 2 Serial and 2 USB.

![Communication Interface](https://user-images.githubusercontent.com/12093019/135689260-73d3602b-70f7-48a5-aa83-eca2504aeaf0.png)
   * `USB (on PA11/PA12)` is the USB port on the front base of the machine.
   * `USB (on PB14/PB15)` is the USB port on the right side of the touchscreen.
   * `Serial (on USART1 PA10/PA9)` is the TFT connector on the mainboard.
   * `Serial (on UART4 PA0/PA1)` is the WiFi connector on the mainboard. <----------Used this config, as UART connection was done using 3 wires

To use serial connections, you have to enable the serial port on the raspberry pi and compile the correct serial port for the BX mainboard. Once you have the serial port enabled on the raspberry pi, it will show up as `/dev/ttyAMAx`, with x being the port number.

Follow this guide for setting up the RPI serial connection: https://gist.github.com/looxonline/89e79b2554771eee8aa8b6492f30400d

Once you have it setup, your printer.cfg should then contain the following under the MCU section: `serial: /dev/ttyAMAx`, substituting the x for your port number.

***

## HDMI configuration
For the HDMI to work properly with the Raspberry Pi, you need the following set in `/boot/config.txt` on the Raspberry Pi. If you are currently using the RPI touchscreen, this should already be setup.

```ini
config_hdmi_boost=7
hdmi_group=2
hdmi_mode=87
hdmi_drive=1
hdmi_cvt=1024 600 60 6 0 0 0
```

## Slicer configuration
For your slicer, you need to call the PRINT_START macro instead of any preliminary gcode. The NOZZLE and BED temps get passed in as arguments. Some examples for the more popular slicers:
* Cura: `PRINT_START BED={material_bed_temperature_layer_0} NOZZLE={material_print_temperature_layer_0}`
* PrusaSlicer: `PRINT_START NOZZLE=[first_layer_temperature] BED=[bed_temperature]`
* Ideamaker: `PRINT_START NOZZLE={temperature_heatbed} BED={temperature_extruder1}`
* Simplify3D: `PRINT_START NOZZLE=[extruder0_temperature] BED=[bed0_temperature]`
* Kiri:Moto: `PRINT_START NOZZLE={temp} BED={bed_temp}`

***

## Klipper Functionality

Here are some notes on how I have Klipper setup and working quite well for my machine.

### Touchscreen Sleep
The Touchscreen will go dark when the printer idle timeout occurs. This happens when there is not a print job in action and currently set for 5 minutes. Pressing the Menu Knob on the display will wake up the Touchscreen.

### LEDS
The Neopixels are setup and will cycle through colors on bootup. I have the idle timeout set to shut off the LEDS when the printer is inactive. The LEDs automatically come on when a print is started or when the LCD is wakened.

### Homing Routine
I have programmed a reliable homing routine that works well for me, however you can adjust or setup your own to taste. My routine will do the following:
1. Raise the Z axis
2. Home the X axis
3. Home the Y axis
4. Move the probe to the center of the bed (different than the nozzle at center)
5. Home the Z with the probe.
* When starting a print, additionally:
6. After the bed reaches temp, the printer waits for 90 seconds with the probe close to the bed to warm up the probe.
7. Steps 1-5 are repeated with a warm probe
8. Move to the origin to start the print.

## OctoDash custom buttons
I wanted some custom configs for OctoDash to control the LEDs and the extruder from the control screen. Here are my entries to make that happen. Edit `/config/octodash/config.json` from the home directory on the Raspberry Pi with the icons you want from below.
```
		"octodash": {
			"customActions": [
				{
					"icon": "home",
					"command": "G28 X Y Z",
					"color": "#dcdde1",
					"confirm": false,
					"exit": true
				},
				{
					"icon": "snowflake",
					"command": "M140 S0; M104 S0",
					"color": "#0097e6",
					"confirm": false,
					"exit": true
				},
				{
					"icon": "long-arrow-alt-down",
					"command": "M83; G1 E5 F100",
					"color": "#00ff00",
					"confirm": false,
					"exit": false
				},
				{
					"icon": "long-arrow-alt-up",
					"command": "M83; G1 E-5 F100",
					"color": "#800080",
					"confirm": false,
					"exit": false
				},
				{
					"icon": "sun",
					"command": "SET_LED LED=led RED=1.0 BLUE=1.0 GREEN=1.0; SET_LED LED=knob RED=1.0 BLUE=1.0 GREEN=1.0",
					"color": "#ffff00",
					"confirm": false,
					"exit": false
				},
				{
					"icon": "moon",
					"command": "SET_LED LED=led RED=0.0 BLUE=0.0 GREEN=0.0; SET_LED LED=knob RED=0.0 BLUE=0.0 GREEN=0.0",
					"color": "#bc8f8f",
					"confirm": false,
					"exit": false
				},
				{
					"icon": "redo-alt",
					"command": "[!RELOAD]",
					"color": "#7f8fa6",
					"confirm": true,
					"exit": false
				},
				{
					"icon": "power-off",
					"command": "[!SHUTDOWN]",
					"color": "#e84118",
					"confirm": true,
					"exit": false
				}
