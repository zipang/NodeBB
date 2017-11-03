<!-- IMPORT emails/partials/header.tpl -->

<!-- Email Body : BEGIN -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px;">

	<!-- Hero Image, Flush : BEGIN -->
	<tr>
		<td bgcolor="#efeff0" style="text-align: center; background-image: url({url}/assets/images/emails/triangularbackground.png); background-size: cover; background-repeat: no-repeat;">
			<img src="{url}/assets/images/emails/newtopic.png" width="300" height="300" border="0" align="center" style="width: 300px; height: 300px; max-width: 300px; height: auto; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;" class="g-img">
		</td>
	</tr>
	<!-- Hero Image, Flush : END -->

	<!-- 1 Column Text + Button : BEGIN -->
	<tr>
		<td bgcolor="#efeff0">
			<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
				<tr>
					<td style="padding: 40px 40px 0px 40px; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;">
						<h1 style="margin: 0 0 10px 0; font-family: sans-serif; font-size: 24px; line-height: 27px; color: #333333; font-weight: normal;">[[email:greeting_with_name, {username}]],</h1>
						<p style="margin: 0 0 20px 0;">{summary}:</p>
					</td>
				</tr>
				<tr>
					<td style="padding: 0px 60px 40px 60px; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;">
						{message.content}
					</td>
				</tr>
				<tr>
					<td style="padding: 0 40px; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;">
						<!-- Button : BEGIN -->
						<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: auto;">
							<tr>
								<td style="border-radius: 3px; background: #222222; text-align: center;" class="button-td">
									<a href="{url}/chats/{roomId}" style="background: #222222; border: 15px solid #222222; font-family: sans-serif; font-size: 13px; line-height: 1.1; text-align: center; text-decoration: none; display: block; border-radius: 3px; font-weight: bold;" class="button-a">
										<span style="color:#ffffff;" class="button-link">&nbsp;&nbsp;&nbsp;&nbsp;[[email:notif.chat.cta]]&nbsp;&nbsp;&nbsp;&nbsp;</span>
									</a>
								</td>
							</tr>
						</table>
						<!-- Button : END -->
					</td>
				</tr>
				<tr>
					<td style="padding: 40px; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;">
						<h2 style="margin: 0 0 10px 0; font-family: sans-serif; font-size: 18px; line-height: 21px; color: #333333; font-weight: bold;">[[email:closing]]</h2>
						<p style="margin: 0;">{site_title}</p>
					</td>
				</tr>
			</table>
		</td>
	</tr>
	<!-- 1 Column Text + Button : END -->

</table>
<!-- Email Body : END -->

<!-- IMPORT emails/partials/footer.tpl -->
