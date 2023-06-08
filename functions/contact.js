/*
 * This script handles the contact form.
 * Copyright (c) 2023 AmazinAxel (Alec) <amazinaxel.com>
 * This program is licensed under the GPLv3.
 */

export async function onRequestPost({ request, env }) {
	try {
		// Setup Turnstile variables
		const data = await request.formData(); // Get all form data
		const token = data.get("cf-turnstile-response"); // Get Turnstile token
		const ip = request.headers.get("CF-Connecting-IP"); // Get IP
	
		// Verify Turnstile token
		let formData = new FormData() // Create FormData
		formData.append("secret", env.TURNSTILE_SECRET); // Get private key secret from environment variable
		formData.append("response", token); // Get the response token
		formData.append("remoteip", ip); // Pass the user's IP
	
		// Get response from Turnstile API
		const turnstileResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { body: formData, method: "POST"});
	
		const turnstileStatus = await turnstileResponse.json(); // Get Turnstile report
	
		// Check if the user didn't pass the captcha
		if (!turnstileStatus.success) { return new Response('Encountered a problem with the captcha verification. Please try again.', { status: 511 });}

		// Check if the last message was sent recently
		const diffInMinutes = (new Date() - new Date(await env.last_mail.get('last_mail'))) / 60000; // Calculate time difference
		// Return error message if a message was sent recently
		if (diffInMinutes < 30) { return new Response('Someone else sent a message recently. Please try sending your message later.', { status: 409 });} // Return if the last message was sent recently


		let output = []; // Initialize output variable
		for (let [key, value] of data) { output[key] = !value ? "Unknown" : value; } // Use expression to check if value is set and replace it with "Not Set" if unset

		// Check if the title or message isn't set, return
		if (output.title.includes("Unknown") || output.message.includes("Unknown")) { return new Response('A title and message are required to send the message.', { status: 412 });}


		/**     We've passed all checks! Let's move on to sending the message!     **/
	
		let sendRequest = new Request("https://api.mailchannels.net/tx/v1/send", { // MailChannel API
		  method: "POST",
		  headers: { "content-type": "application/json" },
		  body: JSON.stringify({
			personalizations: [
			  {
				to: [{ name: "AmazinAxel", email: env.EMAIL }],
				/* dkim_domain: "amazinaxel.com",
				dkim_selector: "mailchannels",
				dkim_private_key: env.DKIM_KEY // Uncomment this if you have a DKIM key */
			  }
			],
			from: { name: 'AmazinAxel.com Contact Form', email: env.EMAIL },
			reply_to: { name: output.name, email: output.email },
			subject: 'New Contact Form Message: ' + output.title,
			content: [{	
				type: "text/plain",
				value: "You have recieved a new message from: " + output.name + "\nEmail: " + output.email + "\n---\n" + output.message
			  }]
		  })
		})
	
		const mailChannelsResponse = await fetch(sendRequest) // Check if it was sent successfully

		// If there was an error sending the message, show error message
		if (!mailChannelsResponse.ok) { return new Response('Encountered an internal error while sending the message. Please try again later.', { status: 503 });}

		// Update last mail sent variable
		const newlastMail = new Date(new Date().getTime() + 30 * 60000); // Create new time and add 30 minutes
		await env.last_mail.put('last_mail', newlastMail.toISOString()); // Save the lastMailSent variable in Workers KV
		return new Response('The message has been successfully sent. Thank you.', { status: 200 });

	} catch(err) { return new Response('Encountered an error while processing the form. Please try again. Error: ' + err, { status: 500 });}
}