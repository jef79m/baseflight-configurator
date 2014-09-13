'use strict';

TABS.initial_setup = {
    yaw_fix: 0.0
};

TABS.initial_setup.initialize = function (callback) {
    var self = this;
    GUI.active_tab_ref = this;
    GUI.active_tab = 'initial_setup';
    googleAnalytics.sendAppView('Initial Setup');

    function load_ident() {
        MSP.send_message(MSP_codes.MSP_IDENT, false, false, load_misc_data);
    }

    function load_misc_data() {
        MSP.send_message(MSP_codes.MSP_MISC, false, false, load_html);
    }

    function load_html() {
        $('#content').load("./tabs/initial_setup.html", process_html);
    }

    MSP.send_message(MSP_codes.MSP_ACC_TRIM, false, false, load_ident);

    function process_html() {
        // translate to user-selected language
        localize();

        // initialize 3D
        self.initialize3D();

        // Fill in misc stuff
        $('input[name="mincellvoltage"]').val(MISC.vbatmincellvoltage);
        $('input[name="maxcellvoltage"]').val(MISC.vbatmaxcellvoltage);
        $('input[name="voltagescale"]').val(MISC.vbatscale);

        $('input[name="minthrottle"]').val(MISC.minthrottle);
        $('input[name="maxthrottle"]').val(MISC.maxthrottle);
        $('input[name="failsafe_throttle"]').val(MISC.failsafe_throttle);
        $('input[name="mincommand"]').val(MISC.mincommand);

        $('input[name="mag_declination"]').val(MISC.mag_declination / 10);

        // Fill in the accel trimms from CONFIG object
        $('input[name="pitch"]').val(CONFIG.accelerometerTrims[0]);
        $('input[name="roll"]').val(CONFIG.accelerometerTrims[1]);

        // Display multiType and motor diagram (if such exist)
        var str = '';
        switch (CONFIG.multiType) {
            case 1: // TRI
                str = 'TRI';
                $('.modelMixDiagram').attr('src', './images/motor_order/tri.svg').addClass('modelMixTri');
                break;
            case 2: // QUAD +
                str = 'Quad +';
                $('.modelMixDiagram').attr('src', './images/motor_order/quadp.svg').addClass('modelMixQuadP');
                break;
            case 3: // QUAD X
                str = 'Quad X';
                $('.modelMixDiagram').attr('src', './images/motor_order/quadx.svg').addClass('modelMixQuadX');
                break;
            case 4: // BI
                str = 'BI';
                break;
            case 5: // GIMBAL
                str = 'Gimbal';
                break;
            case 6: // Y6
                str = 'Y6';
                $('.modelMixDiagram').attr('src', './images/motor_order/y6.svg').addClass('modelMixY6');
                break;
            case 7: // HEX 6
                str = 'HEX 6';
                $('.modelMixDiagram').attr('src', './images/motor_order/hex6p.svg').addClass('modelMixHex6P');
                break;
            case 8: // FLYING_WING
                str = 'Flying Wing';
                break;
            case 9: // Y4
                str = 'Y4';
                $('.modelMixDiagram').attr('src', './images/motor_order/y4.svg').addClass('modelMixY4');
                break;
            case 10: // HEX6 X
                str = 'HEX6 X';
                $('.modelMixDiagram').attr('src', './images/motor_order/hex6x.svg').addClass('modelMixHex6X');
                break;
            case 11: // OCTO X8
            case 12:
            case 13:
                str = 'OCTO X8';
                $('.modelMixDiagram').attr('src', './images/motor_order/octox.svg').addClass('modelMixOctoX');
                break;
            case 14: // AIRPLANE
                str = 'Airplane';
                $('.modelMixDiagram').attr('src', './images/motor_order/airplane.svg').addClass('modelMixAirplane');
                break;
            case 15: // Heli 120
                str = 'Heli 120';
                break;
            case 16: // Heli 90
                str = 'Heli 90';
                break;
            case 17: // Vtail
                str = 'Vtail';
                $('.modelMixDiagram').attr('src', './images/motor_order/vtail.svg').addClass('modelMixVtail');
                break;
            case 18: // HEX6 H
                str = 'HEX6 H';
                $('.modelMixDiagram').attr("src", './images/motor_order/custom.svg').addClass('modelMixCustom');
                break;
            case 19: // PPM to SERVO
                str = 'PPM to SERVO';
                $('.modelMixDiagram').attr("src", './images/motor_order/custom.svg').addClass('modelMixCustom');
                break;
            case 20: // Dualcopter
                str = 'Dualcopter';
                $('.modelMixDiagram').attr("src", './images/motor_order/custom.svg').addClass('modelMixCustom');
                break;
            case 21: // Singlecopter
                str = 'Singlecopter';
                $('.modelMixDiagram').attr("src", './images/motor_order/custom.svg').addClass('modelMixCustom');
                break;
        }

        $('span.model').text(chrome.i18n.getMessage('initialSetupModel', [str]));

        // Heading
        $('span.heading').text(chrome.i18n.getMessage('initialSetupheading', [0]));

        // UI Hooks
        $('a.calibrateAccel').click(function () {
            var self = $(this);

            if (!self.hasClass('calibrating')) {
                self.addClass('calibrating');

                // During this period MCU won't be able to process any serial commands because its locked in a for/while loop
                // until this operation finishes, sending more commands through data_poll() will result in serial buffer overflow
                GUI.interval_pause('initial_setup_data_pull');
                MSP.send_message(MSP_codes.MSP_ACC_CALIBRATION, false, false, function () {
                    GUI.log(chrome.i18n.getMessage('initialSetupAccelCalibStarted'));
                });

                GUI.timeout_add('button_reset', function () {
                    GUI.interval_resume('initial_setup_data_pull');

                    GUI.log(chrome.i18n.getMessage('initialSetupAccelCalibEnded'));

                    self.removeClass('calibrating');
                }, 2000);
            }
        });

        $('a.calibrateMag').click(function () {
            var self = $(this);

            if (!self.hasClass('calibrating')) {
                self.addClass('calibrating');

                MSP.send_message(MSP_codes.MSP_MAG_CALIBRATION, false, false, function () {
                    GUI.log(chrome.i18n.getMessage('initialSetupMagCalibStarted'));
                });

                GUI.timeout_add('button_reset', function () {
                    GUI.log(chrome.i18n.getMessage('initialSetupMagCalibEnded'));
                    self.removeClass('calibrating');
                }, 30000);
            }
        });

        $('a.resetSettings').click(function() {
            MSP.send_message(MSP_codes.MSP_RESET_CONF, false, false, function () {
                GUI.log(chrome.i18n.getMessage('initialSetupSettingsRestored'));

                GUI.tab_switch_cleanup(function() {
                    TABS.initial_setup.initialize();
                });
            });
        });


        $('a.update').click(function () {
            CONFIG.accelerometerTrims[0] = parseInt($('input[name="pitch"]').val());
            CONFIG.accelerometerTrims[1] = parseInt($('input[name="roll"]').val());

            var buffer_out = new Array();
            buffer_out[0] = lowByte(CONFIG.accelerometerTrims[0]);
            buffer_out[1] = highByte(CONFIG.accelerometerTrims[0]);
            buffer_out[2] = lowByte(CONFIG.accelerometerTrims[1]);
            buffer_out[3] = highByte(CONFIG.accelerometerTrims[1]);

            // Send over the new trims
            MSP.send_message(MSP_codes.MSP_SET_ACC_TRIM, buffer_out);

            MISC.vbatmincellvoltage = parseFloat($('input[name="mincellvoltage"]').val()) * 10;
            MISC.vbatmaxcellvoltage = parseFloat($('input[name="maxcellvoltage"]').val()) * 10;
            MISC.vbatscale = parseInt($('input[name="voltagescale"]').val());

            MISC.minthrottle = parseInt($('input[name="minthrottle"]').val());
            MISC.maxthrottle = parseInt($('input[name="maxthrottle"]').val());
            MISC.failsafe_throttle = parseInt($('input[name="failsafe_throttle"]').val());
            MISC.mincommand = parseInt($('input[name="mincommand"]').val());

            MISC.mag_declination = parseFloat($('input[name="mag_declination"]').val()) * 10;

            // we also have to fill the unsupported bytes
            var buffer_out = new Array();
            buffer_out[0] = 0; // powerfailmeter
            buffer_out[1] = 0;
            buffer_out[2] = lowByte(MISC.minthrottle);
            buffer_out[3] = highByte(MISC.minthrottle);
            buffer_out[4] = lowByte(MISC.maxthrottle);
            buffer_out[5] = highByte(MISC.maxthrottle);
            buffer_out[6] = lowByte(MISC.mincommand);
            buffer_out[7] = highByte(MISC.mincommand);
            buffer_out[8] = lowByte(MISC.failsafe_throttle);
            buffer_out[9] = highByte(MISC.failsafe_throttle);
            buffer_out[10] = 0;
            buffer_out[11] = 0;
            buffer_out[12] = 0;
            buffer_out[13] = 0;
            buffer_out[14] = 0;
            buffer_out[15] = 0;
            buffer_out[16] = lowByte(MISC.mag_declination);
            buffer_out[17] = highByte(MISC.mag_declination);
            buffer_out[18] = MISC.vbatscale;
            buffer_out[19] = MISC.vbatmincellvoltage;
            buffer_out[20] = MISC.vbatmaxcellvoltage;
            buffer_out[21] = 0; // vbatlevel_crit (unused)

            // Send over new misc
            MSP.send_message(MSP_codes.MSP_SET_MISC, buffer_out, false, save_to_eeprom);

            function save_to_eeprom() {
                MSP.send_message(MSP_codes.MSP_EEPROM_WRITE, false, false, function () {
                    GUI.log(chrome.i18n.getMessage('initialSetupEepromSaved'));
                });
            }
        });

        // display current yaw fix value (important during tab re-initialization)
        $('div#interactive_block > a.reset').text(chrome.i18n.getMessage('initialSetupButtonResetZaxisValue', [self.yaw_fix]));

        // reset yaw button hook
        $('div#interactive_block > a.reset').click(function () {
            self.yaw_fix = SENSOR_DATA.kinematics[2] * - 1.0;
            $(this).text(chrome.i18n.getMessage('initialSetupButtonResetZaxisValue', [self.yaw_fix]));

            console.log('YAW reset to 0 deg, fix: ' + self.yaw_fix + ' deg');
        });

        $('#content .backup').click(configuration_backup);

        $('#content .restore').click(configuration_restore);

        // data pulling functions used inside interval timer
        function get_analog_data() {
            MSP.send_message(MSP_codes.MSP_ANALOG, false, false, get_attitude_data);
        }

        function get_attitude_data() {
            MSP.send_message(MSP_codes.MSP_ATTITUDE, false, false, update_ui);
        }

        function update_ui() {
            // Update voltage indicator
            $('.bat-voltage').text(chrome.i18n.getMessage('initialSetupBatteryValue', [ANALOG.voltage]));
            $('.bat-mah-drawn').text(chrome.i18n.getMessage('initialSetupBatteryMahValue', [ANALOG.mAhdrawn]));
            $('.bat-mah-drawing').text(chrome.i18n.getMessage('initialSetupBatteryAValue', [ANALOG.amperage.toFixed(2)]));
            $('.rssi').text(chrome.i18n.getMessage('initialSetupRSSIValue', [((ANALOG.rssi / 1023) * 100).toFixed(0)]));

            // Update heading
            $('span.heading').text(chrome.i18n.getMessage('initialSetupheading', [SENSOR_DATA.kinematics[2]]));

            // update 3D
            self.render3D();
        }

        GUI.interval_add('initial_setup_data_pull', get_analog_data, 50, true);

        // status data pulled via separate timer with static speed
        GUI.interval_add('status_pull', function () {
            MSP.send_message(MSP_codes.MSP_STATUS);
        }, 250, true);

        if (callback) callback();
    }
};

TABS.initial_setup.initialize3D = function () {
    var self = this,
        canvas = $('#canvas'),
        wrapper = $('#canvas_wrapper'),
        scene = new THREE.Scene(),
        camera = new THREE.PerspectiveCamera(50, wrapper.width() / wrapper.height(), 1, 10000),
        renderer = new THREE.WebGLRenderer({
            canvas: canvas.get(0),
            alpha: true,
            antialias: true
        }),
        meshWrapper = new THREE.Object3D();

    var geometry = new THREE.BoxGeometry(150, 80, 300);
    var materials = [
        new THREE.MeshBasicMaterial({color: 0xff3333}),
        new THREE.MeshBasicMaterial({color: 0xff8800}),
        new THREE.MeshBasicMaterial({color: 0xffff33}),
        new THREE.MeshBasicMaterial({color: 0x33ff33}),
        new THREE.MeshBasicMaterial({color: 0x3333ff}),
        new THREE.MeshBasicMaterial({color: 0x8833ff}),
    ];
    var boxMaterials = new THREE.MeshFaceMaterial(materials);
    var mesh = new THREE.Mesh(geometry, boxMaterials);

    renderer.setSize(wrapper.width(), wrapper.height());
    camera.position.z = 600;
    scene.add(camera);
    scene.add(meshWrapper);
    meshWrapper.add(mesh);

    this.render3D = function () {
        mesh.rotation.x = (SENSOR_DATA.kinematics[1] * -1.0) * 0.017453292519943295; // this one is acting up
        meshWrapper.rotation.y = ((SENSOR_DATA.kinematics[2] * -1.0) - self.yaw_fix) * 0.017453292519943295;
        mesh.rotation.z = (SENSOR_DATA.kinematics[0] * -1.0) * 0.017453292519943295;

        renderer.render(scene, camera);
    }

    this.render3D();

    // handle window resize
    $(window).resize(function () {
        renderer.setSize(wrapper.width(), wrapper.height());
        camera.aspect = wrapper.width() / wrapper.height();
        camera.updateProjectionMatrix();

        self.render3D();
    });
};

TABS.initial_setup.cleanup = function (callback) {
    $(window).unbind('resize');

    if (callback) callback();
};