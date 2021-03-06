/*
Copyright 2018 FileThis, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
/* This is not a visual element */
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
import '@polymer/polymer/polymer-legacy.js';

import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="ft-global-variable">

    <!-- This is not a visual element -->
    <template>
        <style>
            :host {
                display: none;
            }
        </style>
    </template>

    
</dom-module>`;

document.head.appendChild($_documentContainer.content);

// Make sure the "FileThis" namespace exists
window.FileThis = window.FileThis || {};
window.FileThis.FtGlobalVariables = window.FileThis.FtGlobalVariables || {};

window.FileThis.FtGlobalVariables.gNameToReferencesMap = {};
window.FileThis.FtGlobalVariables.gDidInitialPropagation = false;
window.FileThis.FtGlobalVariables.gPropagating = false;

window.FileThis.FtGlobalVariables.initialize = function()
{
    if (window.FileThis.FtGlobalVariables.gDidInitialPropagation)
        return;

    var nameToReferencesMap = window.FileThis.FtGlobalVariables.gNameToReferencesMap;
    for (var name in nameToReferencesMap)
    {
        if (!nameToReferencesMap.hasOwnProperty(name))
            continue;

        var references = nameToReferencesMap[name];

        // Find the first reference that has a defined value
        // We want the first one because it will be the outermost element.
        var referenceWithValue = null;
        var referenceCount = references.length;
        var lastReferenceIndex = referenceCount - 1;
        for (var index = 0; index <= lastReferenceIndex; index++)
        {
            var reference = references[index];
            var value = reference.get("value");

            if (value !== undefined)
            {
                referenceWithValue = reference;
                break;
            }
        }

        // If there is no reference with a value, skip to the next variable name
        if (!referenceWithValue)
            continue;

        // Propagate its value
        referenceWithValue._propagateValue();
    }

    window.FileThis.FtGlobalVariables.gDidInitialPropagation = true;
};

window.FileThis.FtGlobalVariables.propagateValue = function(name, value)
{
    // Set the values of all other references to our value
    var references = window.FileThis.FtGlobalVariables.gNameToReferencesMap[name];
    if (!references)
        return;
    window.FileThis.FtGlobalVariables.gPropagating = true;
    references.forEach(function(reference)
    {
        if (reference !== this)
            reference.set("value", value);
    }.bind(this));
    window.FileThis.FtGlobalVariables.gPropagating = false;
};

Polymer({

    is: 'ft-global-variable',

    observers:
    [
        "_onNameOrValueChanged(name, value)",
    ],

    properties:
    {
        name: {
            type: String,
        },

        value: {
            notify: true,
        },

        _registered: {
            type: Boolean,
            value: false
        },
    },

    attached: function()
    {
        this._register();
    },


    detached: function()
    {
        this._unregister();
    },
    
    _register: function()
    {
        if (this._registered)
            return;

        this._registered = true;

        var name = this.name;

        // If there is no reference to our name, yet
        var references = window.FileThis.FtGlobalVariables.gNameToReferencesMap[name];
        if (references === undefined)
        {
            // Add our reference to the list, and we're done
            window.FileThis.FtGlobalVariables.gNameToReferencesMap[name] = [this];
            return;
        }

        // If our reference is already in the list, do nothing
        var index = references.indexOf(this);
        var isReferenced = (index > 0);
        if (isReferenced)
            return;

        // Add our reference to the list
        references.push(this);
    },

    _unregister: function()
    {
        var name = this.name;

        // If there are no references to our name, do nothing
        var references = window.FileThis.FtGlobalVariables.gNameToReferencesMap[name];
        if (references === undefined)
            return;

        // If our reference is not in the list, do nothing
        var index = references.indexOf(this);
        var isReferenced = (index > 0);
        if (!isReferenced)
            return;

        // Remove our reference from the list
        references.splice(index, 1);
    },

    _onNameOrValueChanged: function(name, value)
    {
        // Make sure we're registered
        this._register();

        // If not wired yet, do nothing
        if (!window.FileThis.FtGlobalVariables.gDidInitialPropagation)
            return;

        // If we are in the middle of propagating, do nothing
        if (window.FileThis.FtGlobalVariables.gPropagating)
            return;

        // If "name" is not defined yet, wait until it is
        if (name === undefined)
            return;

        // Propagate the value
        // TODO: This does not quite work. If another global variable depends on this one, it won't propagate when it changes...
        this._propagateValue();
    },

    _propagateValue: function()
    {
        var name = this.name;
        var value = this.get("value");

        window.FileThis.FtGlobalVariables.propagateValue(name, value);
    },

})
