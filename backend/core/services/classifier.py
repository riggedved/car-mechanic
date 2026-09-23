import re

AUTOMOTIVE_KEYWORDS = {
    # Core systems
    'car', 'vehicle', 'truck', 'auto', 'automobile', 'suv', 'sedan', 'van', 'motor',
    'engine', 'transmission', 'gearbox', 'brakes', 'brake', 'pad', 'pads', 'rotor', 'rotors',
    'caliper', 'drum', 'battery', 'alternator', 'starter', 'solenoid', 'radiator', 'coolant',
    'antifreeze', 'thermostat', 'water pump', 'oil', 'filter', 'dipstick', 'exhaust', 'muffler',
    'catalytic converter', 'manifold', 'oxygen sensor', 'o2 sensor', 'suspension', 'strut',
    'shock', 'spring', 'sway bar', 'control arm', 'ball joint', 'tie rod', 'steering',
    'power steering', 'rack and pinion', 'clutch', 'flywheel', 'driveshaft', 'differential',
    'axle', 'cv joint', 'boot', 'wheel', 'tire', 'tyre', 'tires', 'rim', 'tread',
    'spark plug', 'ignition coil', 'distributor', 'fuel pump', 'fuel injector', 'fuel tank',
    'turbo', 'turbocharger', 'supercharger', 'intercooler', 'timing belt', 'timing chain',
    'serpentine belt', 'fan belt', 'pulley', 'tensioner', 'air conditioner', 'ac', 'compressor',
    'condenser', 'evaporator', 'blower motor', 'heater core', 'fuse', 'fuse box', 'wiring',
    'obd', 'obd2', 'dtc', 'check engine', 'cel', 'abs', 'traction control', 'tpms', 'airbag',
    'headlight', 'taillight', 'indicator', 'wiper', 'windshield', 'gasket', 'head gasket',
    'valve cover', 'piston', 'cylinder', 'camshaft', 'crankshaft',

    # Symptoms & mechanical sensations
    'squeal', 'squealing', 'squeak', 'squeaking', 'grind', 'grinding', 'knock', 'knocking',
    'rattle', 'rattling', 'clunk', 'clunking', 'click', 'clicking', 'hiss', 'hissing',
    'hum', 'humming', 'whine', 'whining', 'vibration', 'shaking', 'shudder', 'wobble',
    'pulling', 'smoke', 'smoking', 'overheating', 'overheat', 'stall', 'stalling', 'hesitation',
    'sluggish', 'misfire', 'misfiring', 'backfire', 'leak', 'leaking', 'puddle', 'fluid',
    'no crank', 'cranking', 'dead battery', 'jump start', 'limp mode', 'rough idle', 'idling',
    'spongy', 'soft pedal', 'hard pedal', 'burning smell', 'sweet smell', 'gas smell', 'odour',
    'mileage', 'mpg', 'service', 'maintenance', 'tune up', 'inspection', 'diagnostic',

    # Driving conditions & operating states
    'speed', 'speeding', 'highway', 'idle', 'idling', 'accelerate', 'acceleration', 'accelerating',
    'braking', 'turning', 'steer', 'steering', 'stopping', 'crank', 'cranking', 'drive', 'driving',
    'shift', 'shifting', 'gear', 'reverse', 'park', 'neutral', 'load',

    # Thermal & environmental symptoms
    'temperature', 'temprature', 'temp', 'hot', 'cold', 'warm', 'heat', 'steam', 'vapor',
    'fumes', 'smell', 'odor', 'burnt', 'burning', 'boil', 'boiling', 'coolant', 'radiator',

    # Media, visual & diagnostic references
    'photo', 'image', 'picture', 'pic', 'clip', 'video', 'bay', 'hood', 'bonnet', 'sound',
    'noise', 'audio', 'meter', 'gauge', 'indicator', 'light', 'needle', 'leak', 'uploaded'
}

CAR_MAKES = {
    'toyota', 'honda', 'ford', 'chevrolet', 'chevy', 'nissan', 'hyundai', 'kia',
    'volkswagen', 'vw', 'subaru', 'mazda', 'bmw', 'mercedes', 'mercedes-benz',
    'audi', 'lexus', 'jeep', 'dodge', 'ram', 'chrysler', 'volvo', 'porsche',
    'mitsubishi', 'land rover', 'range rover', 'jaguar', 'infiniti', 'acura',
    'cadillac', 'buick', 'gmc', 'lincoln', 'tesla', 'mini', 'fiat', 'genesis',
    'skoda', 'renault', 'peugeot', 'suzuki', 'maruti', 'maruti suzuki', 'tata', 'mahindra'
}

NON_CAR_TOPICS = [
    r'\b(recipe|cook|bake|ingredient|food|dinner|lunch|pasta|pizza|cake)\b',
    r'\b(python|javascript|react|html|css|sql|coding|programming|algorithm|git)\b',
    r'\b(crypto|bitcoin|ethereum|stock market|forex|investing)\b',
    r'\b(president|election|minister|politics|government|senate)\b',
    r'\b(homework|essay|poem|song|story|lyrics)\b',
    r'\b(doctor|medicine|illness|symptom of flu|fever|cough|headache)\b',
    r'\b(weather today|forecast|rain tomorrow)\b',
]

GREETING_PATTERNS = [
    r'^(hi|hello|hey|howdy|greetings|good\s*(morning|afternoon|evening)|sup)\b'
]


def is_greeting(text: str) -> bool:
    cleaned = text.strip().lower()
    if len(cleaned.split()) <= 4:
        for pattern in GREETING_PATTERNS:
            if re.search(pattern, cleaned):
                return True
    return False


def is_clearly_irrelevant(text: str) -> bool:
    cleaned = text.lower()
    for pattern in NON_CAR_TOPICS:
        if re.search(pattern, cleaned):
            # Check if there is an explicit car context overriding it
            words = set(re.findall(r'[a-z0-9]+', cleaned))
            if not (words & AUTOMOTIVE_KEYWORDS or words & CAR_MAKES):
                return True
    return False


def is_automotive(text: str) -> bool:
    cleaned = text.lower()
    tokens = set(re.findall(r'[a-z0-9]+', cleaned))
    
    # Check direct match with car makes or auto keywords
    if tokens & AUTOMOTIVE_KEYWORDS:
        return True
    if tokens & CAR_MAKES:
        return True
    
    # Check for OBD-II fault code format (e.g. P0300, P0171, B1234, C0040, U0100)
    if re.search(r'\b[pbcu][0-3][0-9]{3}\b', cleaned):
        return True
        
    # Check for common vehicle phrase structures (e.g., "my 2015 car", "engine light")
    if re.search(r'\b(19\d\d|20\d\d)\b', cleaned) and any(w in cleaned for w in ['miles', 'km', 'wheel', 'door', 'hood', 'bonnet', 'trunk', 'boot']):
        return True

    return False


def extract_vehicle_details(text: str) -> dict:
    details = {}
    cleaned = text.lower()

    # Extract 4-digit year between 1970 and 2027
    year_match = re.search(r'\b(19[7-9]\d|20[0-2]\d)\b', cleaned)
    if year_match:
        details['year'] = year_match.group(1)

    # Extract make
    for make in CAR_MAKES:
        if re.search(rf'\b{re.escape(make)}\b', cleaned):
            details['make'] = make.capitalize()
            break

    # Extract mileage (e.g., 75000 miles, 120k km, 90,000 mi, 45,000 km)
    mileage_match = re.search(r'(\d+[\d,]*\s*(?:k|thousand)?\s*(?:miles|mile|mi|km|kms))\b', cleaned)
    if mileage_match:
        details['mileage'] = mileage_match.group(1).strip()

    return details


def get_polite_rejection() -> str:
    return (
        "I'm an automotive technician, so I specialize strictly in vehicle diagnostics, mechanical troubleshooting, "
        "and maintenance. If you're experiencing any car troubles—like unusual engine noises, brake issues, fluid leaks, "
        "vibrations, or dashboard warning lights—tell me what vehicle you drive and the symptoms you're noticing, "
        "and I'll be glad to help inspect it."
    )


def get_mechanic_greeting() -> str:
    return (
        "Hello! I'm Mac, your senior automotive technician. I'm here to help you get to the bottom of whatever "
        "is going on with your vehicle.\n\n"
        "To help me pinpoint the issue accurately, please share:\n"
        "1. What is the Year, Make, and Model of your car? (e.g. 2019 Honda City or 2018 Maruti Swift)\n"
        "2. What symptoms are you noticing? (e.g. grinding noise, shuddering at speed, hard pedal, check engine light)\n\n"
        "You can also attach a photo of the affected component, record engine audio directly, or share a video clip."
    )


def generate_rule_based_followup(text: str, session_context: dict) -> str:
    """
    Generate targeted diagnostic follow-up questions using expert automotive decision trees.
    Saves AI tokens while delivering authentic mechanic investigation!
    """
    cleaned = text.lower()

    # Brake related
    if any(k in cleaned for k in ['brake', 'pad', 'rotor', 'caliper', 'stopping']):
        if 'squeal' in cleaned or 'squeak' in cleaned:
            return (
                "A high-pitched squeal while braking is typically caused by the mechanical wear indicator contacting the rotor, "
                "or glazed brake pads from heavy heat cycles.\n\n"
                "Let's narrow down the exact cause:\n"
                "• Does the squeal happen only under light braking, or does it persist during firm stops as well?\n"
                "• Does it occur mostly first thing in the morning when cold, or continuously once the brakes warm up?\n"
                "• Do you feel any pulsating or vibration through the brake pedal?\n\n"
                "💡 Pro-tip: If you can snap a photo through your wheel spokes showing the pad thickness or rotor surface, upload it and I'll inspect the wear."
            )
        if 'grind' in cleaned or 'scrape' in cleaned:
            return (
                "⚠️ Metal-on-metal grinding when braking is a serious safety concern. It almost certainly means your brake pad friction material is completely worn out, and the steel backing plate is gouging into the brake rotor.\n\n"
                "To assess the severity:\n"
                "• Does the car pull sharply to one side when you step on the pedal?\n"
                "• Do you feel a violent shudder or vibration in the steering wheel or brake pedal?\n\n"
                "🚨 Advice: I recommend avoiding high-speed driving or highway commutes until this is addressed, as stopping distances are severely compromised. Click 'Generate Full Diagnostic Report' below for repair estimates, and we can get a technician booked to replace the pads and rotors."
            )

    # Battery / Starter / No-start
    if any(k in cleaned for k in ['start', 'crank', 'battery', 'alternator', 'turn over']):
        if 'click' in cleaned or 'rapid click' in cleaned:
            return (
                "A rapid clicking sound when you turn the ignition key or push the start button is the starter solenoid engaging and immediately dropping out due to low voltage under load.\n\n"
                "Here is what we need to check:\n"
                "• Do the dashboard lights, cabin lights, or headlights dim significantly when you try to crank?\n"
                "• How old is your 12V battery (most car batteries have a reliable lifespan of 3 to 4 years)?\n"
                "• Have you noticed any white, blue, or greenish powdery corrosion build-up around the battery terminals?\n\n"
                "If you have a multimeter handy, measure the resting voltage across the terminals—it should read 12.4V to 12.6V."
            )
        if 'crank' in cleaned and ('no start' in cleaned or 'won\'t start' in cleaned):
            return (
                "If the engine cranks over vigorously but won't fire up, your starter and battery are likely healthy. An internal combustion engine needs four pillars to start: Fuel, Spark, Air, and Compression.\n\n"
                "Let's run through a quick diagnostic check:\n"
                "• When you switch the ignition to 'ON' without cranking, do you hear a faint 2-second hum from the rear seat area? (That's the fuel pump priming).\n"
                "• Is the security or immobilizer key symbol flashing rapidly on the dashboard?\n"
                "• Did the car stall suddenly while driving, or did this happen after parking overnight?"
            )

    # Overheating / Coolant
    if any(k in cleaned for k in ['overheat', 'overheating', 'coolant', 'temperature', 'steam', 'hot', 'radiator']):
        return (
            "🚨 Engine overheating can cause catastrophic damage (warped cylinder head, blown head gasket) in just a few minutes. Please pull over safely if driving!\n\n"
            "To diagnose the failure point:\n"
            "• Is there visible steam escaping from under the bonnet, or a puddle of green, pink, or orange coolant underneath the engine bay?\n"
            "• Does the temperature gauge spike when you are stuck in traffic at idle, or when driving at higher speeds on open roads?\n"
            "• Can you hear the electric radiator cooling fan kicking on when the temperature gauge rises above halfway?\n\n"
            "⚠️ Safety reminder: Never attempt to open the radiator cap while the engine is hot—it is under extreme steam pressure."
        )

    # Check Engine Light / Misfire
    if any(k in cleaned for k in ['check engine', 'cel', 'misfire', 'rough idle', 'shaking']):
        return (
            "A Check Engine Light accompanied by a rough idle or engine shudder indicates a cylinder misfire or air-fuel mixture imbalance (often bad ignition coils, fouled spark plugs, or a vacuum leak).\n\n"
            "Important diagnostic details:\n"
            "• Is the Check Engine Light illuminated steady, or is it FLASHING? (A flashing check engine light indicates an active severe misfire that can destroy the catalytic converter within miles).\n"
            "• Does the shuddering smooth out once you accelerate past 2,000 RPM, or does it get worse under load?\n"
            "• Do you have an OBD-II scanner code (such as P0300 random misfire, or cylinder-specific P0301-P0304)?"
        )

    # AC / Air Conditioning
    if any(k in cleaned for k in ['ac', 'air conditioning', 'cooling', 'blows warm', 'compressor', 'chilled']):
        return (
            "If your vehicle's air conditioner is blowing warm ambient air instead of chilled air, it usually boils down to low refrigerant (gas leak), an AC compressor clutch failure, or a clogged cabin air filter.\n\n"
            "Let's troubleshoot:\n"
            "• When you toggle the AC button on, do you hear a distinct 'click' from the engine bay and a slight dip in engine RPM? (That's the compressor magnetic clutch engaging).\n"
            "• Does the air blow slightly cool when driving at highway speeds, but warm while stopped at traffic lights?\n"
            "• Is there any hissing sound coming from behind the dashboard vents when you switch the AC on?"
        )

    # Transmission / Shifting
    if any(k in cleaned for k in ['transmission', 'gear', 'shift', 'slipping', 'clutch', 'gearbox']):
        return (
            "Transmission slippage or harsh gear shifts should be diagnosed early to prevent internal gear or clutch pack destruction.\n\n"
            "Key diagnostic questions:\n"
            "• Does the engine RPM rev up when you step on the accelerator, but the car takes a moment to actually speed up (slipping)?\n"
            "• If it's an automatic, does it hesitate or jerk when shifting between 1st and 2nd gear, or when shifting into Reverse?\n"
            "• If it's a manual, is the clutch pedal biting very high up near the top, or is it hard to engage gears when stopped?"
        )

    return ""
