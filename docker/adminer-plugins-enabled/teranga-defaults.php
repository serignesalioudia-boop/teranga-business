<?php

/** Teranga Business — préremplit le formulaire de connexion Adminer
 * Le champ Serveur est géré par index.php (env ADMINER_DEFAULT_SERVER, défaut: db).
 * Ce plugin préremplit Utilisateur et Base de données. Le mot de passe reste
 * à saisir manuellement (aucun champ Adminer n'accepte de valeur par défaut).
 */
class AdminerTerangaDefaults {

	function loginFormField($name, $heading, $value) {
		if ($name == 'username') {
			return $heading . "<input name='auth[username]' id='username' value='teranga_business' autocomplete='username' autocapitalize='off'>\n";
		}
		if ($name == 'db') {
			return $heading . "<input name='auth[db]' value='teranga_business' autocapitalize='off'>\n";
		}
	}

}

return new AdminerTerangaDefaults();
